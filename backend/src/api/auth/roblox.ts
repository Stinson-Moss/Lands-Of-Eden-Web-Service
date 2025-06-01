import { Router } from 'express';
import { getDiscordInfo } from '@utility/discord';
import { getRobloxInfoWithKey } from '@utility/roblox';
import { verifySession, generateSessionData } from '@utility/session';
import { SESSION_EXPIRATION, COOKIE_EXPIRATION } from '@utility/constants';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import Database from '@classes/database';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;

const router = Router();

router.post('/roblox', async (req, res) => {

    const session = req.cookies.session;
    let [token, refreshToken] = JSON.parse(session);
    const result = await Database.select().from(Database.users).where(eq(Database.users.token, token));
    const queryObject = result[0];

    if (!queryObject) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const sessionResponse = await verifySession(session, queryObject);

    if (!sessionResponse.verified) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    try {
      const discordInfo = await getDiscordInfo(queryObject.discordToken!, queryObject.discordRefreshToken!, queryObject.discordTokenExpires!)
      if (discordInfo.user.id !== queryObject.discordId!) {
        return res.status(401).json({ error: 'Invalid token: Discord ID mismatch' });
      }
  
      const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', {
        client_id: ROBLOX_CLIENT_ID,
        client_secret: ROBLOX_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
  
      const { access_token } = tokenResponse.data;
  
      const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
  
      let query: string | null = null;
      let sessionQuery = '';
      let discordQuery = '';
      let robloxQuery = '';
      const updateFields = [];
  
      if (sessionResponse.needsUpdate) {
        sessionQuery = `token = ?, refreshToken = ?, tokenExpires = ?,`
        updateFields.push(sessionResponse.data.token, sessionResponse.data.refreshToken, sessionResponse.data.expiresIn)
      }
  
      if (discordInfo.token !== queryObject.discordToken) {
        discordQuery = `discordToken = ?, discordRefreshToken = ?, discordTokenExpires = ?,`
        updateFields.push(discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn)
      }
  
      robloxQuery = `robloxId = ?`
      updateFields.push(userResponse.data.sub)
  
      // Combine all the queries
      if (updateFields.length > 0) {
        query = `UPDATE users SET 
          ${sessionQuery}
          ${discordQuery}
          ${robloxQuery}
          WHERE token = ?`;
          
          await Database.update(Database.users).set({
            ...updateFields,
            token: token
          }).where(eq(Database.users.token, token));
      }
  
      res.cookie('session', JSON.stringify({token: token, refreshToken: refreshToken}), {
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
          roblox: {
            username: userResponse.data.preferred_username,
            displayname: userResponse.data.name,
            avatar: userResponse.data.picture,
          },
        },
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  });
  