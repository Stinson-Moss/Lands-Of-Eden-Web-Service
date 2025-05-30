import axios from 'axios';
import { Guild, PermissionsBitField } from 'discord.js';
import DiscordClient from '@classes/discordclient';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function getDiscordGuilds(token: string, discordId: string) {
  let clientGuilds = DiscordClient.client?.guilds.cache;

  try {
    const userResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const userGuilds: Guild[] = userResponse.data;
    const guilds = clientGuilds?.filter(async (guild) => {
      if (userGuilds.some(g => g.id === guild.id)) {
        const member = guild.members.cache.get(discordId) ?? await guild.members.fetch(discordId);
        if (member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return true;
        }
      }

      return false;
    });

    return guilds;
  } catch (error) {
    console.error('Error getting discord guilds:', error);
    return null;
  }
}

export async function getDiscordInfo(token: string, refreshToken: string, expiresIn: number) {
  if (expiresIn < Date.now() / 1000) {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { discord_access_token, discord_refresh_token, discord_expires_in } = tokenResponse.data;
    token = discord_access_token
    refreshToken = discord_refresh_token
    expiresIn = Math.floor(Date.now() / 1000 + discord_expires_in)
  }
  
  const userResponse = await axios.get('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    user: userResponse.data,
    token: token,
    refreshToken: refreshToken,
    expiresIn: expiresIn
  };
} 