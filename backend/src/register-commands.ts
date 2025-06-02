import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.DISCORD_CLIENT_ID;
const devGuildId = process.env.DISCORD_DEV_GUILD_ID;
const token = process.env.DISCORD_TOKEN;

// console.log('DEV GUILD ID: ', process.env);

const commands: SlashCommandBuilder[] = [];
const commandsFolderPath = path.join(process.cwd(), 'src/commands').toString();
const commandFolders = fs.readdirSync(commandsFolderPath);

for (const folder of commandFolders) {
    const commandPath = path.join(commandsFolderPath, folder);
    const commandFiles = fs.readdirSync(commandPath).filter((file: string) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            console.log(command);
        }
    }
}

// REST
const rest = new REST().setToken(token as string);

(async () => {
    try {

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId as string, devGuildId as string),
            { body: commands }
        );

        const length = (data as unknown[]).length;

        console.log(`Successfully reloaded ${length} application commands.`);
    } catch (error) {
        console.error(`Error refreshing application commands:`, error);
    }
})();