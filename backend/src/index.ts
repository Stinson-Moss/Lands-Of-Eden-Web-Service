import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'node:path';
import apiRouter from './api';
import DiscordClient from './classes/discordclient';
import { Collection, Client, GatewayIntentBits } from 'discord.js';
import { updateGroupIcons } from '@utility/roblox';

const REDIRECT_URI: string = process.env.REDIRECT_URI || '';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

if (process.env.NODE_ENV === 'development') {
  dotenv.config({path: `.env.development`});
} else {
  dotenv.config();
}

const app = express();

app.use(cors({
  origin: REDIRECT_URI,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api', apiRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

console.log('Starting bot...');

const suffix = process.env.NODE_ENV === 'development' ? '.ts' : '.js';

// commands
const cmdFoldersPath = path.join(__dirname, 'commands');
const cmdFolders = fs.readdirSync(cmdFoldersPath);

for (const folder of cmdFolders) {
    const cmdPath = path.join(cmdFoldersPath, folder);
    const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith(suffix));

    for (const file of cmdFiles) {
        const filePath = path.join(cmdPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
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
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Set the client
client.once('ready', () => {
    console.log('Bot is ready!');
    DiscordClient.setClient(client);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Error logging in:', error);
});

// Update group icons
updateGroupIcons();