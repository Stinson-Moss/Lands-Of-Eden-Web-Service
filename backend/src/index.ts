import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI: string = process.env.REDIRECT_URI || '';
const SESSION_EXPIRATION = 3600;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  port: parseInt(process.env.DB_PORT || '3306'),

  ssl: {
    ca: fs.readFileSync(process.env.DB_CA || ''),
    rejectUnauthorized: true
  }
  
})

function generateSessionData() {
  const access_token = crypto.randomBytes(32).toString('hex');
  const refresh_token = crypto.randomBytes(32).toString('hex');
  return { token: access_token, refreshToken: refresh_token, expiresIn: SESSION_EXPIRATION };
}

async function getDiscordInfo(token: string, refreshToken: string, expiresIn: number) {
  if (expiresIn < Date.now()) {
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
    expiresIn = discord_expires_in
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

async function getRobloxInfo(token: string, refreshToken: string, expiresIn: number) {
  
  if (expiresIn < Date.now()) {
    const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', {
      client_id: ROBLOX_CLIENT_ID,
      client_secret: ROBLOX_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    token = access_token
    refreshToken = refresh_token
    expiresIn = expires_in

    // update the roblox tokens in the database
    const query = `UPDATE users
    SET robloxToken = ?, robloxRefreshToken = ?, robloxTokenExpires = ? WHERE token = ?`;
    await pool.query(query, [token, refreshToken, expiresIn, token]);
  }

  const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    user: userResponse.data,
    token: token,
    refreshToken: refreshToken,
    expiresIn: expiresIn
  }
}

const app = express();
app.use(cors({
  origin: REDIRECT_URI,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());

// Discord Auth
app.post('/auth/getUser', async (req, res) => {
  const { code, token, refreshToken } = req.body;

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
      const query = `INSERT INTO users (discordId, token, refreshToken, discordToken, discordRefreshToken, tokenExpires, discordTokenExpires, robloxToken, robloxRefreshToken, robloxTokenExpires, robloxId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      discordId = VALUES(discordId), token = VALUES(token), refreshToken = VALUES(refreshToken), discordToken = VALUES(discordToken), discordRefreshToken = VALUES(discordRefreshToken), tokenExpires = VALUES(tokenExpires), discordTokenExpires = VALUES(discordTokenExpires)`
      
      await pool.query(query, [
        userResponse.data.id, 
        sessionData.token, 
        sessionData.refreshToken, 
        access_token, 
        refresh_token, 
        Date.now() + SESSION_EXPIRATION,
        expires_in, 
        null,
        null,
        null,
        0
      ])
      
      res.json({
        session: sessionData,
        user: {
          discord: {
            username: userResponse.data.username,
            avatar: userResponse.data.avatar,
            id: userResponse.data.id,
          },
        }
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  } else if (token) {

    const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
    
    if (!rows || (rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token: Token not found' });
    }

    const queryObject = (rows as any[])[0]

    if (queryObject.tokenExpires < Date.now()) {
      return res.status(401).json({ error: 'Invalid token: Token expired' });
    }

    const discordInfo = await getDiscordInfo(queryObject.discordToken, queryObject.discordRefreshToken, queryObject.discordTokenExpires)

    if (discordInfo.token != queryObject.discordToken) {
      // update the user in the database
      const query = `UPDATE users
      SET discordToken = ?, discordRefreshToken = ?, discordTokenExpires = ? WHERE token = ?`;
      await pool.query(query, [discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn, token]);
    }

    const robloxInfo = await getRobloxInfo(queryObject.robloxToken, queryObject.robloxRefreshToken, queryObject.robloxTokenExpires)

    res.json({
      session: {token: queryObject.token, refreshToken: queryObject.refreshToken, expiresIn: queryObject.tokenExpires},
      user: {
        discord: {
          username: discordInfo.user.username,
          avatar: discordInfo.user.avatar,
          id: discordInfo.user.id,
        },
        roblox: {
          username: robloxInfo.user.preferred_username,
          displayname: robloxInfo.user.name,
          avatar: robloxInfo.user.picture,
        }
      }
    });

  } else if (refreshToken) {

    // query the database for the user with the refresh token
    const [rows] = await pool.query('SELECT * FROM users WHERE refreshToken = ?', [refreshToken])

    if (!rows || (rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid refresh token: Refresh token not found' });
    }

    const queryObject = (rows as any[])[0];
    const newSessionData = generateSessionData()
    const discordInfo = await getDiscordInfo(queryObject.discordToken, queryObject.discordRefreshToken, queryObject.discordTokenExpires)

    if (discordInfo.token != queryObject.discordToken) {
      // update the user in the database and the session data
      const query = `UPDATE users
      SET token = ?, refreshToken = ?, tokenExpires = ?, discordToken = ?, discordRefreshToken = ?, discordTokenExpires = ? WHERE token = ?`;
      await pool.query(query, [newSessionData.token, newSessionData.refreshToken, newSessionData.expiresIn, discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn, token]);
    } else {
      // update the session data only
      const query = `UPDATE users
      SET token = ?, refreshToken = ?, tokenExpires = ? WHERE token = ?`;
      await pool.query(query, [newSessionData.token, newSessionData.refreshToken, newSessionData.expiresIn, token]);
    }

    const robloxInfo = await getRobloxInfo(queryObject.robloxToken, queryObject.robloxRefreshToken, queryObject.robloxTokenExpires)

    res.json({
      session: newSessionData,
      user: {
        discord: {
          username: discordInfo.user.username,
          avatar: discordInfo.user.avatar,
          id: discordInfo.user.id,
        },
        roblox: {
          username: robloxInfo.user.preferred_username,
          displayname: robloxInfo.user.name,
          avatar: robloxInfo.user.picture,
        }
      }
    })
  }
})

app.post('/api/roblox/token', async (req, res) => {
  try {
    const { code, token } = req.body;

    if (!code || !token) {
      return res.status(400).json({ error: 'No code or token provided' });
    }

    // verify the token
    const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
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

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // update the roblox tokens in the database
    const updateQuery = `UPDATE users
    SET robloxToken = ?, robloxRefreshToken = ?, robloxTokenExpires = ?, robloxId = ? WHERE token = ?`;
    await pool.query(updateQuery, [access_token, refresh_token, expires_in, userResponse.data.sub, token]);


    const formattedUser = {
      username: userResponse.data.preferred_username,
      displayname: userResponse.data.name,
      picture: userResponse.data.picture,
    }

    res.json({
      user: formattedUser,
    });
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 