import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CommandData, Command, BuildCommand } from '../../utility/command'

const commandData: CommandData = {
    name: "verify",
    description: "Verify the user with their roblox account",
    options: []
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
