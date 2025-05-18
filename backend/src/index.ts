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
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
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

async function getRobloxInfo(token: string) {
  const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    user: userResponse.data
  }
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
          discordTokenExpires = VALUES(discordTokenExpires),
          robloxId = VALUES(robloxId)
      `
      await pool.query(query, [
        userResponse.data.id, 
        sessionData.token, 
        sessionData.refreshToken, 
        access_token, 
        refresh_token, 
        Math.floor(Date.now() / 1000 + SESSION_EXPIRATION),
        Math.floor(Date.now() / 1000 + expires_in),
        null
      ])

      const [rows] = await pool.query(`
        SELECT * 
        FROM users 
        WHERE discordId = ?`, 
        [userResponse.data.id])

      const queryObject = (rows as any[])[0]
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
            username: robloxInfo.user.username,
            displayname: robloxInfo.user.displayName,
            avatar: robloxInfo.thumbnail,
          } : null
        }
      });
      
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange token: ' + error });
    }
  } else if (session) {

    try {

      console.log('SESSION:', session)
      session = JSON.parse(session);
      let { token, refreshToken } = session;
      const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
      
      if (!rows || (rows as any[]).length !== 1) {
        return res.status(401).json({ error: 'Invalid token: Token not found' });
      }
  
      const queryObject = (rows as any[])[0]
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
        sessionQuery = `token = ?, refreshToken = ?, tokenExpires = ?,`
        updateFields.push(token, refreshToken, Math.floor(Date.now() / 1000 + SESSION_EXPIRATION))
      }
  
      if (discordInfo.token !== queryObject.discordToken) {
        discordQuery = `discordToken = ?, discordRefreshToken = ?, discordTokenExpires = ?,`
        updateFields.push(discordInfo.token, discordInfo.refreshToken, discordInfo.expiresIn)
      }
      // Combine all the queries
      if (updateFields.length > 0) {
        query = `UPDATE users SET 
          ${sessionQuery}
          ${discordQuery}
          WHERE token = ?`;
        
        await pool.query(query, [
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
            username: robloxInfo.user.username,
            displayname: robloxInfo.user.displayName,
            avatar: robloxInfo.thumbnail,
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
    let expiresIn = null;
    let needsUpdate = false;

    const [rows] = await pool.query('SELECT * FROM users WHERE token = ?', [token])
    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queryObject = (rows as any[])[0]
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

    const { access_token} = tokenResponse.data;

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
        
        await pool.query(query, [...updateFields, token])
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

    const [rows] = await pool.query(`
      SELECT * FROM users WHERE token = ?
      `, [token])

    if ((rows as any[]).length !== 1) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const queryObject = (rows as any[])[0]
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

    if (updateFields.length > 0) {
      query = `UPDATE users SET 
        ${sessionQuery}
        ${robloxQuery}
        WHERE token = ?`
        
        await pool.query(query, [...updateFields, token])
    }

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 