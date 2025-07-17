import { Router } from 'express';
import Database from '@classes/database';
import { Role, PermissionsBitField } from 'discord.js';
import { verifySession } from '@utility/session';
import { COOKIE_EXPIRATION } from '@utility/constants';
import { getDiscordGuilds } from '@utility/discord';
import { eq } from 'drizzle-orm';

const router = Router();

function canManageRole(botRole : Role, role: Role) {
  return !role.managed 
  && role.name !== '@everyone' 
  && role.position < botRole.position 
  && (botRole.permissions.has(PermissionsBitField.Flags.ManageRoles) || botRole.permissions.has(PermissionsBitField.Flags.Administrator));
}

router.get('', async (req, res) => {
  const session = req.cookies.session;
  const {token} = JSON.parse(session);
  
  const result = await Database.pool.select().from(Database.users).where(eq(Database.users.token, token));
  const queryObject = result[0];
  
  const sessionResponse = await verifySession(session, queryObject);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {

    const discordGuilds = await getDiscordGuilds(queryObject.discordToken!, queryObject.discordId!);

    if (!discordGuilds) {
      return res.status(500).json({ error: 'Failed to get discord guilds' });
    }
    
    if (sessionResponse.needsUpdate) {
      // save the new session data

      await Database.pool.update(Database.users).set({
        token: sessionResponse.data.token,
        refreshToken: sessionResponse.data.refreshToken,
        tokenExpires: sessionResponse.data.expiresIn
      }).where(eq(Database.users.token, queryObject.token!));
    }
    
    res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
      httpOnly: true,
      secure: true,
      maxAge: COOKIE_EXPIRATION,
      sameSite: 'none',
    });
    
    res.json({
      guilds: discordGuilds.map(guild => {
        return {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          memberCount: guild.memberCount,

          roles: guild.roles.cache.filter(role => canManageRole(guild.members.me!.roles.highest, role)).map(role => {
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