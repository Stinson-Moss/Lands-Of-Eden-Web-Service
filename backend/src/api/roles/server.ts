import DiscordClient from '@classes/discordclient';
import { Router } from 'express';
import { Guild } from 'discord.js';
import { verifySession } from '@utility/session';

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

  const roles = server.roles.cache.map(role => {
    return {
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position
    }
  })

  res.json(roles)

})

export default router; 