import DiscordClient from '@classes/discordclient';
import { Router } from 'express';
import { Guild } from 'discord.js';
import { verifySession } from '@utility/session';
import { eq } from 'drizzle-orm';
import { COOKIE_EXPIRATION } from '@utility/constants';
import Database from '@classes/database';

const router = Router();

router.get('/:serverId', async (req, res) => {
  const serverId = req.params.serverId;

  const session = req.cookies.session;
  const sessionResponse = await verifySession(session, null);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (!serverId) {
    return res.status(400).json({ error: 'No server ID provided' });
  }

  const client = DiscordClient.client;
  const server: Guild = client?.guilds.cache.get(serverId) ?? await client?.guilds.fetch(serverId);

  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  if (sessionResponse.needsUpdate) {
    await Database.pool.update(Database.users).set({
      token: sessionResponse.data.token,
      refreshToken: sessionResponse.data.refreshToken,
      tokenExpires: sessionResponse.data.expiresIn
    }).where(eq(Database.users.token, sessionResponse.data.token));

  }

  const validRoles = server.roles.cache.filter(role => role.name !== '@everyone' && !role.managed).sort((a, b) => a.name.localeCompare(b.name));
  
  res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
    httpOnly: true,
    secure: true,
    maxAge: COOKIE_EXPIRATION,
    sameSite: 'none',
  });

  res.json(validRoles.map(role => {
    return {
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position
    }
  }));
});

export default router; 