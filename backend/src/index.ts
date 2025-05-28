import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { Collection, Client, GatewayIntentBits, PermissionsBitField, Guild } from 'discord.js';
import groups from './utility/groups.json'
import DiscordClient from './classes/discordclient';
import Database from './classes/database';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI: string = process.env.REDIRECT_URI || '';
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const SESSION_EXPIRATION = 600; // 10 minutes in seconds
const COOKIE_EXPIRATION = 365 * 24 * 60 * 60 * 1000;

interface sessionResponse {
  verified: boolean;
  needsUpdate: boolean;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  }
}

async function verifySession(session: string | null, data : any | null) {
  let response: sessionResponse = {
    verified: false,
    needsUpdate: false,
    data: {
      token: '',
      refreshToken: '',
      expiresIn: 0
    }
  }
  
  if (!session) {
    console.log('No session found')
    return response;
  }

  console.log('SESSION:', session)

  const { token, refreshToken } = JSON.parse(session);

  if (!token || !refreshToken) {
    console.log('No token or refresh token found')
    return response;
  }

  let queryObject;

  if (data) {
    queryObject = data;
  } else {
    const [rows] = await Database.query('SELECT token, refreshToken, tokenExpires FROM users WHERE token = ?', [token])
    
    if (!rows || (rows as any[]).length !== 1) {
      console.log('No rows found')
      return response;
    }
    
    queryObject = (rows as any[])[0]
  }

  if (!queryObject.token || !queryObject.refreshToken) {
    console.log('No token or refresh token found')
    return response;
  }

  if (queryObject.tokenExpires < Date.now() / 1000) {
    if (queryObject.refreshToken !== refreshToken) {
      console.log('Refresh token mismatch')
      return response;
    }

    const sessionData = generateSessionData();
    response.needsUpdate = true;
    response.data = sessionData;
    response.verified = true;

    console.log('Session needs update')
    return response;
  }

  response.verified = true;
  response.needsUpdate = false;
  response.data = {
    token: queryObject.token,
    refreshToken: queryObject.refreshToken,
    expiresIn: queryObject.tokenExpires
  }

  console.log('Session verified')
  return response;
}

function generateSessionData() {
  const access_token = crypto.randomBytes(32).toString('hex');
  const refresh_token = crypto.randomBytes(32).toString('hex');
  return { token: access_token, refreshToken: refresh_token, expiresIn: Date.now() / 1000 + SESSION_EXPIRATION };
}

async function getDiscordGuilds(token: string, discordId: string) {
  let clientGuilds = DiscordClient.client?.guilds.cache;

  try {
    const userResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // console.log('USER RESPONSE:', userResponse.data)
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

async function getDiscordInfo(token: string, refreshToken: string, expiresIn: number) {
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

async function getRobloxInfoWithKey(userid: number) {
  const userResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}`, {
    headers: {
      'x-api-key': ROBLOX_API_KEY!,
    },
  });

  const thumbnailResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${userid}:generateThumbnail?size=60&format=PNG&shape=ROUND`,
    {
      headers: {
        'x-api-key': ROBLOX_API_KEY!,
      },
    }
  )

  return {
    user: userResponse.data,
    thumbnail: thumbnailResponse.data
  }
}

const app = express();
app.use(cors({
  origin: REDIRECT_URI,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Discord Auth
app.post('/auth/getUser', async (req, res) => {
  const { code, csrf } = req.body;
  let session = req.cookies.session;

  console.log('CODE:', code)

  if (code) {

    try {
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
        new URLSearchParams({
          client_id: DISCORD_CLIENT_ID!,
          client_secret: DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
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
      const query = `
        INSERT INTO users (
          discordId, token, refreshToken, discordToken, discordRefreshToken, 
          tokenExpires, discordTokenExpires, robloxId
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
          discordId = VALUES(discordId),
          token = VALUES(token),
          refreshToken = VALUES(refreshToken),
          discordToken = VALUES(discordToken),
          discordRefreshToken = VALUES(discordRefreshToken),
          tokenExpires = VALUES(tokenExpires),
          discordTokenExpires = VALUES(discordTokenExpires)
      `
      await Database.query(query, [
        userResponse.data.id, 
        sessionData.token, 
        sessionData.refreshToken, 
        access_token, 
        refresh_token, 
        Math.floor(Date.now() / 1000 + SESSION_EXPIRATION),
        Math.floor(Date.now() / 1000 + expires_in),
        null
      ])

      const [rows] = await Database.query(`
        SELECT * 
        FROM users 
        WHERE discordId = ?`, 
        [userResponse.data.id])

      const queryObject = (rows as any[])[0]

      if (!queryObject.token || !queryObject.refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Tokens not found' });
      }

      let robloxInfo = queryObject.robloxId && queryObject.robloxId > 0? await getRobloxInfoWithKey(queryObject.robloxId) : null

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
      session = JSON.parse(session);
      let { token, refreshToken } = session;
      
      if (!token || !refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Token or refresh token not found' });
      }

      const [rows] = await Database.query('SELECT * FROM users WHERE token = ?', [token])
      
      if (!rows || (rows as any[]).length !== 1) {
        return res.status(401).json({ error: 'Invalid token: Token not found' });
      }
  
      const queryObject = (rows as any[])[0]

      if (!queryObject.token || !queryObject.refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Tokens not found' });
      }

      let expiresIn = queryObject.tokenExpires;
      let needsUpdate = false;
  
      if (expiresIn < Date.now() / 1000) {
        if (queryObject.refreshToken !== refreshToken) {
          return res.status(401).json({ error: 'Invalid token: Refresh token mismatch' });
        }
  
        const sessionData = generateSessionData();
        token = sessionData.token;
        refreshToken = sessionData.refreshToken;
        expiresIn = sessionData.expiresIn;
        needsUpdate = true;
      }
  
      const discordInfo = await getDiscordInfo(queryObject.discordToken, queryObject.discordRefreshToken, queryObject.discordTokenExpires)
      const robloxInfo = queryObject.robloxId && queryObject.robloxId > 0? await getRobloxInfoWithKey(queryObject.robloxId) : null
  
      let query: string | null = null;
      let sessionQuery = '';
      let discordQuery = '';
      const updateFields = [];
  
      if (needsUpdate) {
        sessionQuery = `token = ?, refreshToken = ?, tokenExpires = ?`
        updateFields.push(token, refreshToken, Math.floor(Date.now() / 1000 + SESSION_EXPIRATION))
      }
  
      if (discordInfo.token !== queryObject.discordToken) {
        discordQuery = `discordToken = ?, discordRefreshToken = ?, discordTokenExpires = ?`
        updateFields.push(discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn)
      }
      // Combine all the queries
      if (updateFields.length > 0) {
        query = `UPDATE users SET 
          ${sessionQuery}${discordQuery.length > 0 ? `,` : ''}
          ${discordQuery}
          WHERE token = ?`;
        
        await Database.query(query, [
          ...updateFields,
          queryObject.token
        ]);
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

app.post('/auth/roblox', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // verify the token
    let session = req.cookies.session;
    if (!session) {
      return res.status(401).json({ error: 'No login information found' });
    }

    session = JSON.parse(session);
    let { token, refreshToken } = session;

    if (!token || !refreshToken) {
      return res.status(401).json({ error: 'Invalid token: Token or refresh token not found' });
    }

    let expiresIn = null;
    let needsUpdate = false;

    const [rows] = await Database.query('SELECT * FROM users WHERE token = ?', [token])
    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queryObject = (rows as any[])[0]

    if (!queryObject.token || !queryObject.refreshToken) {
      return res.status(401).json({ error: 'Invalid token: Tokens not found' });
    }

    const discordInfo = await getDiscordInfo(queryObject.discordToken, queryObject.discordRefreshToken, queryObject.discordTokenExpires)
    expiresIn = queryObject.tokenExpires;

    if (discordInfo.user.id !== queryObject.discordId) {
      return res.status(401).json({ error: 'Invalid token: Discord ID mismatch' });
    }

    if (queryObject.tokenExpires < Date.now() / 1000) {
      if (queryObject.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Refresh token mismatch' });
      }

      const sessionData = generateSessionData();
      token = sessionData.token;
      refreshToken = sessionData.refreshToken;
      expiresIn = sessionData.expiresIn;
      needsUpdate = true;
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

    if (needsUpdate) {
      sessionQuery = `token = ?, refreshToken = ?, tokenExpires = ?,`
      updateFields.push(token, refreshToken, expiresIn)
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
        
        await Database.query(query, [...updateFields, token])
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

app.post('/logout', async (req, res) => {
  const session = req.cookies.session;

  if (!session) {
    return res.status(401).json({ error: 'No login session found' });
  }

  let {token, refreshToken} = JSON.parse(session);

  if (!token || !refreshToken) {
    return res.status(401).json({ error: 'No login tokens found' });
  }

  const [rows] = await Database.query(`
    SELECT * FROM users WHERE token = ?
    `, [token])

  if ((rows as any[]).length !== 1) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const queryObject = (rows as any[])[0]

  if (!queryObject.token || !queryObject.refreshToken) {
    return res.status(401).json({ error: 'Invalid token: Tokens not found' });
  }
  
  await Database.query(`
    UPDATE users
    SET token = NULL, refreshToken = NULL, tokenExpires = NULL
    WHERE token = ?
  `, [token]);

  res.clearCookie('session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.json({
    success: true
  })
})

app.post('/unlink', async (req, res) => {
  try {
    const session = req.cookies.session;

    if (!session) {
      return res.status(401).json({ error: 'No login session found' });
    }

    let {token, refreshToken} = JSON.parse(session);

    if (!token || !refreshToken) {
      return res.status(401).json({ error: 'No login tokens found' });
    }

    const [rows] = await Database.query(`
      SELECT * FROM users WHERE token = ?
      `, [token])

    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queryObject = (rows as any[])[0]

    if (!queryObject.token || !queryObject.refreshToken) {
      return res.status(401).json({ error: 'Invalid token: Tokens not found' });
    }

    let needsUpdate = false;

    if (queryObject.tokenExpires < Date.now() / 1000) {
      if (queryObject.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Invalid token: Refresh token mismatch' });
      }

      const newSessionData = generateSessionData();
      token = newSessionData.token;
      refreshToken = newSessionData.refreshToken;
      needsUpdate = true;
    }

    let query: string | null = null;
    let sessionQuery = '';
    let robloxQuery = 'robloxId = NULL';
    const updateFields = [];

    if (needsUpdate) {
      sessionQuery = `token = ?, refreshToken = ?, tokenExpires = ?,`
      updateFields.push(token, refreshToken, Math.floor(Date.now() / 1000 + SESSION_EXPIRATION))
    }

    query = `UPDATE users SET 
      ${sessionQuery}
      ${robloxQuery}
      WHERE token = ?`
      
    await Database.query(query, [...updateFields, token])

    res.cookie('session', JSON.stringify({token: token, refreshToken: refreshToken}), {
      httpOnly: true,
      secure: true,
      maxAge: COOKIE_EXPIRATION,
      sameSite: 'none',
    });

    res.json({
      success: true
    })
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
})

app.get('/ping', (req, res) => {
  res.json({
    success: true
  })
})

app.get('/api/servers', async (req, res) => {
  const session = req.cookies.session;
  
  let [rows] = await Database.query('SELECT * FROM users WHERE token = ?', [JSON.parse(session).token])
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

app.get('/api/group/:name', async (req, res) => {
  const groupName = req.params.name;

  if (!groupName) {
    return res.status(400).json({ error: 'No group name provided' });
  }

  console.log('GROUP NAME:', groupName)
  const group = groups[groupName as keyof typeof groups];

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json(group);
})

app.get('/api/groups', async (req, res) => {
  res.json(groups);
})

app.get('/api/roles/:serverId', async (req, res) => {
  const serverId = req.params.serverId;

  if (!serverId) {
    return res.status(400).json({ error: 'No server ID provided' });
  }

  const client = DiscordClient.client;

  const server: Guild = client?.guilds.cache.get(serverId) ?? await client?.guilds.fetch(serverId);

  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  console.log('SERVER:', server)

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

app.get('/api/bindings/:serverId', async (req, res) => {
  const session = req.cookies.session;
  const sessionResponse = await verifySession(session, null);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const serverId = req.params.serverId;
  if (!serverId) {
    return res.status(400).json({ error: 'No server ID provided' });
  }
  

  const [rows] = await Database.query('SELECT * FROM bindings WHERE serverId = ?', [serverId]);
  let bindings = (rows as any[])[0];

  if (!bindings) {
    bindings = {
      serverId: serverId,
      bindingSettings: {}
    }
  }


  if (sessionResponse.needsUpdate) {
    Database.query(`
      UPDATE users
      SET token = ?, refreshToken = ?, tokenExpires = ?
      WHERE token = ?
    `, [sessionResponse.data.token, sessionResponse.data.refreshToken, sessionResponse.data.expiresIn, session]);

    res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
      httpOnly: true,
      secure: true,
      maxAge: COOKIE_EXPIRATION,
      sameSite: 'none',
    });
  }

  res.json(bindings.bindingSettings);
})

app.post('/api/bindings/:serverId', async (req, res) => {
  const session = req.cookies.session;
  const sessionResponse = await verifySession(session, null);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const serverId = req.params.serverId;
  console.log('SERVER ID:', serverId)

  if (!serverId) {
    return res.status(400).json({ error: 'No server ID provided' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'No body provided' });
  }

  if (!DiscordClient.client.guilds.cache.get(serverId)) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const bindings: {[key: string]: {rank: number, operator: string, secondaryRank?: number, roles: string[]}} = JSON.parse(req.body);
  console.log('BINDINGS:', bindings)

  // check if the bindings are valid
  for (const [groupName, binding] of Object.entries(bindings)) {
    const group = groups[groupName as keyof typeof groups];

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!groupName || !binding.roles || !binding.rank || !binding.operator) {
      return res.status(400).json({ error: 'Invalid binding' });
    }

    if (binding.operator !== '>=' && binding.operator !== '<=' && binding.operator !== '=' && binding.operator !== 'between') {
      return res.status(400).json({ error: 'Invalid operator' });
    }
    
    if (binding.operator === 'between' && !binding.secondaryRank) {
      return res.status(400).json({ error: 'Secondary rank is required for between operator' });
    }

    if (binding.operator !== 'between' && binding.secondaryRank) {
      return res.status(400).json({ error: 'Secondary rank is only allowed for between operator' });
    }

    if (binding.operator === 'between' && binding.secondaryRank! <= binding.rank) {
      return res.status(400).json({ error: 'Secondary rank must be greater than primary rank' });
    }

    if (binding.operator === 'between' && binding.secondaryRank! > 100) {
      return res.status(400).json({ error: 'Secondary rank must be less than 100' });
    }

    const groupRankCount = Object.keys(group.Ranks).length;
    if (binding.rank > groupRankCount || binding.secondaryRank! > groupRankCount || binding.rank < 1 || binding.secondaryRank! < 1) {
      return res.status(400).json({ error: 'Invalid rank' });
    }
  }

  console.log('BINDINGS ARE VALID')

  try {

    // save binding
    await Database.query(`
      INSERT INTO bindings (serverId, bindingSettings)
      VALUES (?, ?)
    `, [serverId, JSON.stringify(bindings)]);

    if (sessionResponse.needsUpdate) {
      Database.query(`
        UPDATE users
        SET token = ?, refreshToken = ?, tokenExpires = ?
        WHERE token = ?
      `, [sessionResponse.data.token, sessionResponse.data.refreshToken, sessionResponse.data.expiresIn, session])
    }

    res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
      httpOnly: true,
      secure: true,
      maxAge: COOKIE_EXPIRATION,
      sameSite: 'none',
    });

    res.json({ success: true })
  } catch (error) {
    console.error('Error saving binding:', error);
    res.status(500).json({ error: 'Failed to save binding' });
  }
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

console.log('Starting bot...');

// commands
const cmdFoldersPath = path.join(__dirname, 'commands');
const cmdFolders = fs.readdirSync(cmdFoldersPath);

for (const folder of cmdFolders) {
    const cmdPath = path.join(cmdFoldersPath, folder);
    const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.ts'));

    for (const file of cmdFiles) {
        const filePath = path.join(cmdPath, file);
        console.log(`Loading command: ${filePath}`);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Event handlers
const eventFolder = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventFolder).filter(file => file.endsWith('.ts'));

for (const file of eventFiles) {
    const filePath = path.join(eventFolder, file);
    console.log(`Loading event: ${filePath}`);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`Loaded event: ${event.name}`);
}

// Set the client
client.once('ready', () => {
    console.log('Bot is ready!');
    DiscordClient.setClient(client);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Error logging in:', error);
});


