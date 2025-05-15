import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI: string = process.env.REDIRECT_URI || '';

const app = express();
app.use(cors({
  origin: REDIRECT_URI,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['POST']
}));
app.use(express.json());


app.post('/api/discord/token', async (req, res) => {
  try {
    console.log("Received Discord token request");
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

    console.log("Token response:", tokenResponse.data);

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log("User response:", userResponse.data);

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
    
  } catch (error) {
    
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 