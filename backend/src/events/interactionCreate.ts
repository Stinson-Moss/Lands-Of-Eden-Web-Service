import { ErrorMessage } from '@/embeds/errorMessage';
import { ChatInputCommandInteraction, Events, GuildMember, Interaction, MessageFlags } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

// interface ButtonActions {
//     [key: string]: (interaction: any) => Promise<void>;
// }

// const buttons: ButtonActions = {}; {
//     const buttonPath = path.join(__dirname, '../buttons');
//     for (const file of fs.readdirSync(buttonPath)) {
//         const name = file.split('.')[0];
//         const action = require(`${buttonPath}/${file}`);

//         if (typeof action === 'function') {
//             buttons[name] = action;
//         }
//     }
// }

const cooldowns = new Map<string, Map<string, number>>();

async function reply(interaction: ChatInputCommandInteraction, content: string, flags: MessageFlags) {
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, flags: flags as any });
    } else {
        await interaction.reply({ content, flags: flags as any });
    }
}

export = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {

        // if (interaction.isButton()) {
        //     console.log(`Button pressed: ${interaction.customId}`);

        //     // Check if the customId corresponds to an action in the actions folder
        //     try {
        //         const actionName = interaction.customId;
                
        //         if (actionName in buttons) {
        //             await buttons[actionName](interaction);
        //         }
        //     } catch (error) {
        //         console.log(`No action found for ${interaction.customId}, falling back to switch statement`);
        //     }

        //     return;
        // }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName)
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        if (command.cooldown) {
            const member = interaction.member as GuildMember;

            if (!cooldowns.has(interaction.commandName)) {
                cooldowns.set(interaction.commandName, new Map());
            }

            const map = cooldowns.get(interaction.commandName) as Map<string, number>;
            const timeStamp = map.get(member.id) ?? null;

            if (timeStamp) {
                const nowSeconds = Math.floor(Date.now() / 1000);
                const timeLeft = timeStamp - nowSeconds;

                if (timeLeft > 0) {
                    await reply(interaction, `You are on cooldown. Please wait ${timeLeft} seconds before using this command again.`, MessageFlags.Ephemeral);

                    return;
                }
            }

            map.set(member.id, Math.floor(Date.now() / 1000) + command.cooldown);
            setTimeout(() => map.delete(member.id), command.cooldown * 1000);
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName} command:`, error);
            await reply(interaction, 'There was an error while executing this command!', MessageFlags.Ephemeral);
        }
        
    }
}
