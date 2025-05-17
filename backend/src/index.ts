import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import cookieParser from 'cookie-parser';

dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI: string = process.env.REDIRECT_URI || '';
const SESSION_EXPIRATION = 3600;
const COOKIE_EXPIRATION = 365 * 24 * 60 * 60 * 1000;

function generateSessionData() {
  const access_token = crypto.randomBytes(32).toString('hex');
  const refresh_token = crypto.randomBytes(32).toString('hex');
  return { token: access_token, refreshToken: refresh_token, expiresIn: Date.now() / 1000 + SESSION_EXPIRATION };
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

async function getRobloxInfo(token: string, refreshToken: string, expiresIn: number) {
  if (!token) {
    return null;
  }

  if (expiresIn < Date.now() / 1000) {
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
    expiresIn = Math.floor(Date.now() / 1000 + expires_in)
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

const app = express();
app.use(cors({
  origin: REDIRECT_URI,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Discord Auth
app.post('/auth/getUser', async (req, res) => {
  const { code } = req.body;
  let session = req.cookies.session;


  if (code) {
    console.log('DISCORD CODE:', code)
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
          tokenExpires, discordTokenExpires, robloxToken, robloxRefreshToken, 
          robloxTokenExpires, robloxId
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
          discordId = VALUES(discordId),
          token = VALUES(token),
          refreshToken = VALUES(refreshToken),
          discordToken = VALUES(discordToken),
          discordRefreshToken = VALUES(discordRefreshToken),
          tokenExpires = VALUES(tokenExpires),
          discordTokenExpires = VALUES(discordTokenExpires)
      `
      await pool.query(query, [
        userResponse.data.id, 
        sessionData.token, 
        sessionData.refreshToken, 
        access_token, 
        refresh_token, 
        Math.floor(Date.now() / 1000 + SESSION_EXPIRATION),
        Math.floor(Date.now() / 1000 + expires_in), 
        null,
        null,
        null,
        0
      ])

      res.cookie('session', JSON.stringify({token: sessionData.token, refreshToken: sessionData.refreshToken, expiresIn: sessionData.expiresIn}), {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_EXPIRATION,
        sameSite: 'none',
      });
      
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
  } else if (session) {

    console.log('SESSION:', session)
    session = JSON.parse(session);
    let { token, refreshToken, expiresIn } = session;
    const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
    
    if (!rows || (rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token: Token not found' });
    }

    const queryObject = (rows as any[])[0]
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
    const robloxInfo = await getRobloxInfo(queryObject.robloxToken, queryObject.robloxRefreshToken, queryObject.robloxTokenExpires)

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

    if (robloxInfo && robloxInfo.token !== queryObject.robloxToken) {
      robloxQuery = `robloxToken = ?, robloxRefreshToken = ?, robloxTokenExpires = ?`
      updateFields.push(robloxInfo.token, robloxInfo.refreshToken, robloxInfo.expiresIn)
    }
    
    // Combine all the queries
    if (updateFields.length > 0) {
      query = `UPDATE users SET 
        ${sessionQuery}
        ${discordQuery}
        ${robloxQuery}
        WHERE token = ?`;
      
      await pool.query(query, [
        ...updateFields,
        queryObject.token
      ]);
    }

    console.log('SET COOKIE')
    res.cookie('session', JSON.stringify({token: token, refreshToken: refreshToken, expiresIn: expiresIn}), {
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
          username: robloxInfo.user.preferred_username,
          displayname: robloxInfo.user.name,
          avatar: robloxInfo.user.picture,
        } : null
      }
    });

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
    console.log('SESSION:', JSON.stringify(session))
    let { token, refreshToken, expiresIn } = session;
    let needsUpdate = false;

    const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queryObject = (rows as any[])[0]
    const discordInfo = await getDiscordInfo(queryObject.discordToken, queryObject.discordRefreshToken, queryObject.discordTokenExpires)

    if (discordInfo.user.id !== queryObject.discordId) {
      return res.status(401).json({ error: 'Invalid token: Discord ID mismatch' });
    }

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

    robloxQuery = `robloxToken = ?, robloxRefreshToken = ?, robloxTokenExpires = ?`
    updateFields.push(access_token, refresh_token, Math.floor(Date.now() / 1000 + expires_in))

    // Combine all the queries
    if (updateFields.length > 0) {
      query = `UPDATE users SET 
        ${sessionQuery}
        ${discordQuery}
        ${robloxQuery}
        WHERE token = ?`;
        
        await pool.query(query, [...updateFields, token])
    }

    const formattedUser = {
      username: userResponse.data.preferred_username,
      displayname: userResponse.data.name,
      picture: userResponse.data.picture,
    }


    res.cookie('session', JSON.stringify({token: token, refreshToken: refreshToken, expiresIn: expiresIn}), {
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
        roblox: formattedUser,
      },
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