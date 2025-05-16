import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const REDIRECT_URI: string = process.env.REDIRECT_URI || '';

const app = express();
app.use(cors({
  origin: REDIRECT_URI,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST'],
  credentials: true,
}));
app.use(express.json());

app.post('/api/discord/token', async (req, res) => {
  try {
    const { code } = req.body;
    
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

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.json({
      user: userResponse.data,
      access_token,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

app.post('/api/roblox/token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
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

    const newFormat = {
      username: userResponse.data.preferred_username,
      displayname: userResponse.data.name,
      picture: userResponse.data.picture,
      id: userResponse.data.sub,
    }
    res.json({
      user: newFormat,
      access_token: access_token,
      refresh_token: refresh_token,
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