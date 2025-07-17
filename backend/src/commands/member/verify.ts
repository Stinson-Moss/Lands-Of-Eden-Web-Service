// verify.ts
// Implements the verification process for members, ensuring their accounts or roles meet required criteria for group participation.
import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CommandData, Command, BuildCommand } from '../../utility/command'

const commandData: CommandData = {
    name: "verify",
    description: "Verify the user with their roblox account",
    options: [],
    cooldown: 5
}

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        embeds: [{
            title: 'Verify',
            description: 'Link your roblox account to your discord account',
            color: parseInt(process.env.EDEN_COLOR as string)
        }],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.REDIRECT_URI as string)
            )
        ]
    });
}

const command: Command = BuildCommand(commandData, execute);

module.exports = command;
