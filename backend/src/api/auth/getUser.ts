import axios from 'axios';
import Database from '@classes/database';
import { Router } from 'express';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { verifySession, generateSessionData } from '@utility/session';
import { SESSION_EXPIRATION, COOKIE_EXPIRATION } from '@utility/constants';
import { getRobloxInfoWithKey } from '@utility/roblox';
import { getDiscordInfo } from '@utility/discord';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const router = Router();

router.post('/getUser', async (req, res) => {
  const { code } = req.body;
  let session = req.cookies.session;

  if (code) {

    try {
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
        new URLSearchParams({
          client_id: DISCORD_CLIENT_ID!,
          client_secret: DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI!,
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const sessionData = generateSessionData()

      // Get user info
      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      

      // if the user exists in the database, update the tokens
      const now = Date.now();
      const result = await Database.insert(users)
      .values({
        discordId: userResponse.data.id,
        robloxId: null,
        token: sessionData.token,
        refreshToken: sessionData.refreshToken,
        discordToken: access_token,
        discordRefreshToken: refresh_token,
        tokenExpires: Math.floor(now / 1000 + SESSION_EXPIRATION),
        discordTokenExpires: Math.floor(now / 1000 + expires_in),
      })
      .onConflictDoUpdate({
        target: users.discordId,
        set: {
          token: sessionData.token,
          refreshToken: sessionData.refreshToken,
          discordToken: access_token,
          discordRefreshToken: refresh_token,
          tokenExpires: Math.floor(Date.now() / 1000 + SESSION_EXPIRATION),
          discordTokenExpires: Math.floor(Date.now() / 1000 + expires_in),
        }
      }).returning();

      const queryObject = result[0];

      if (!queryObject.token || !queryObject.refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Tokens not found' });
      }

      let robloxInfo = queryObject.robloxId && parseInt(queryObject.robloxId) > 0? await getRobloxInfoWithKey(parseInt(queryObject.robloxId)) : null

      res.cookie('session', JSON.stringify({token: sessionData.token, refreshToken: sessionData.refreshToken}), {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_EXPIRATION,
        sameSite: 'none',
      });
      
      res.json({
        user: {
          discord: {
            username: userResponse.data.username,
            avatar: userResponse.data.avatar,
            id: userResponse.data.id,
          },
          roblox: robloxInfo ? {
            username: robloxInfo.user.name,
            displayname: robloxInfo.user.displayName,
            avatar: robloxInfo.thumbnail.response.imageUri,
          } : null
        }
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token: ' + error });
    }
  } else if (session) {

    try {
      let { token, refreshToken } = JSON.parse(session);
      let result = await Database.select().from(users).where(eq(users.token, token));
      let queryObject = result[0];

      const sessionResponse = await verifySession(session, queryObject);

      if (!sessionResponse.verified) {
        return res.status(401).json({ error: 'Invalid session' });
      }
  
      const discordInfo = await getDiscordInfo(queryObject.discordToken!, queryObject.discordRefreshToken!, queryObject.discordTokenExpires!)
      const robloxInfo = queryObject.robloxId && parseInt(queryObject.robloxId) > 0? await getRobloxInfoWithKey(parseInt(queryObject.robloxId)) : null
  
      let query: string | null = null;
      let sessionQuery = '';
      let discordQuery = '';
      const updateFields = [];
  
      if (sessionResponse.needsUpdate) {
        sessionQuery = `token = $1, refreshToken = $2, tokenExpires = $3`
        updateFields.push(token, refreshToken, Math.floor(Date.now() / 1000 + SESSION_EXPIRATION))
      }
  
      if (discordInfo.token !== queryObject.discordToken) {
        discordQuery = `discordToken = $1, discordRefreshToken = $2, discordTokenExpires = $3`
        updateFields.push(discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn)
      }
      // Combine all the queries
      if (updateFields.length > 0) {
        query = `UPDATE users SET 
          ${sessionQuery}${discordQuery.length > 0 ? `,` : ''}
          ${discordQuery}
          WHERE token = $1`;
        
        await Database.update(users).set({
          ...updateFields,
          token: queryObject.token
        }).where(eq(users.token, queryObject.token!));
      }
  
      res.cookie('session', JSON.stringify({token: token, refreshToken: refreshToken}), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_EXPIRATION,
        sameSite: 'none',
      });
      
      res.json({
        user: {
          discord: {
            username: discordInfo.user.username,
            avatar: discordInfo.user.avatar,
            id: discordInfo.user.id,
          },
          roblox: robloxInfo ? {
            username: robloxInfo.user.name,
            displayname: robloxInfo.user.displayName,
            avatar: robloxInfo.thumbnail.response.imageUri,
          } : null
        }
      });
    } catch (error) {
      console.error('Session error:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }

  } else {
    res.json({
      user: null
    })
  }

})

export default router; 