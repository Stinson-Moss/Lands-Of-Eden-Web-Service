import { Router } from 'express';
import { COOKIE_EXPIRATION } from '@utility/constants';
import { Guild, Role, PermissionsBitField } from 'discord.js';
import { verifySession } from '@utility/session';
import { eq } from 'drizzle-orm';
import DiscordClient from '@classes/discordclient';
import Database from '@classes/database';

const router = Router();

function canManageRole(botRole : Role, role: Role) {
  return !role.managed && role.name !== '@everyone' && role.position < botRole.position && botRole.permissions.has(PermissionsBitField.Flags.ManageRoles);
}

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

  const botRole : Role = server.members.me?.roles.cache.find(role => role.managed) as Role;
  const validRoles = server.roles.cache.filter(role => canManageRole(botRole, role)).sort((a, b) => a.name.localeCompare(b.name));
  
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