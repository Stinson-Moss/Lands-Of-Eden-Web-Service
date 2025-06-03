import { Events, Interaction } from 'discord.js';
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

        console.log('INTERACTION CREATE');
        if (!interaction.isChatInputCommand()) return;
        console.log('INTERACTION CREATE 2');
        const command = interaction.client.commands.get(interaction.commandName)
    
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName} command:`, error);
    
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
        
    }
}
