// Set binding rules for the server
import { ChatInputCommandInteraction, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";

const commandData: CommandData = {
    name: "bindings",
    description: "Go to the binding dashboard",
    options: [],
    permissions: PermissionsBitField.Flags.Administrator,
    cooldown: 5
}

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        embeds: [{
            title: 'Bindings',
            description: 'Go to the binding dashboard',
            color: parseInt(process.env.EDEN_COLOR as string)
        }],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('Bindings')
                    .setStyle(ButtonStyle.Link)
                    .setURL(process.env.REDIRECT_URI as string)
            )
        ]
    });
}

module.exports = BuildCommand(commandData, execute);