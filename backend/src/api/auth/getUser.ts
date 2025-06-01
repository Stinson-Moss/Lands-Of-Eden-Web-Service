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

  console.log('GET USER: SESSION', session);

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
      const result = await Database.pool.insert(users)
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
      let result = await Database.pool.select().from(users).where(eq(users.token, token));
      let queryObject = result[0];

      const sessionResponse = await verifySession(session, queryObject);

      if (!sessionResponse.verified) {
        return res.status(401).json({ error: 'Invalid session' });
      }
  
      const discordInfo = await getDiscordInfo(queryObject.discordToken!, queryObject.discordRefreshToken!, queryObject.discordTokenExpires!)
      const robloxInfo = queryObject.robloxId && parseInt(queryObject.robloxId) > 0? await getRobloxInfoWithKey(parseInt(queryObject.robloxId)) : null
  
      // Combine all the queries
      
      await Database.pool.update(users).set({
        token: sessionResponse.data.token,
        refreshToken: sessionResponse.data.refreshToken,
        tokenExpires: sessionResponse.data.expiresIn,
        discordToken: discordInfo.token,
        discordRefreshToken: discordInfo.refreshToken,
        discordTokenExpires: discordInfo.expiresIn
      })
      .where(eq(users.token, token));
      
  
      res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
        httpOnly: true,
        secure: true,
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