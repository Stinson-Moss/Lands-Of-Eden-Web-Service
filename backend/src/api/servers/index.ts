import { Router } from 'express';
import Database from '@classes/database';
import { verifySession } from '@utility/session';
import { COOKIE_EXPIRATION } from '@utility/constants';
import { getDiscordGuilds } from '@utility/discord';

const router = Router();

router.get('', async (req, res) => {
    const session = req.cookies.session;
  const {token, refreshToken} = JSON.parse(session);
  
  let [rows] = await Database.query('SELECT * FROM users WHERE token = ?', [token])
  let queryObject = (rows as any[])[0]
  
  const sessionResponse = await verifySession(session, queryObject);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {

    const discordGuilds = await getDiscordGuilds(queryObject.discordToken, queryObject.discordId);

    if (!discordGuilds) {
      return res.status(500).json({ error: 'Failed to get discord guilds' });
    }
    
    if (sessionResponse.needsUpdate) {
      // save the new session data
      Database.query(`
        UPDATE users
        SET token = ?, refreshToken = ?, tokenExpires = ?
        WHERE token = ?
      `, [sessionResponse.data.token, sessionResponse.data.refreshToken, sessionResponse.data.expiresIn, queryObject.token])
      
      res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_EXPIRATION,
        sameSite: 'none',
      });
    }
    
    res.json({
      guilds: discordGuilds.map(guild => {
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          memberCount: guild.memberCount,
          roles: guild.roles.cache.map(role => {
            return {
              id: role.id,
              name: role.name,
              color: role.color,
              position: role.position
            }
          })
        }
      })
    })
    
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
})

export default router; 