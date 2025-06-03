// Member command: View ranks in a specific group 
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { BuildCommand, CommandData, OptionType } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import groups from "@/data/groups.json";
import Datastore from "@/classes/Datastore";

const commandData: CommandData = {
    name: "ranks",
    description: "View the ranks of a specific group",
    options: [
        {
            name: "group",
            description: "The group to view ranks for",
            type: OptionType.STRING,
            required: true
        }
    ]
}

async function execute(interaction: ChatInputCommandInteraction) {
    const group = interaction.options.getString("group");

    if (!group) {
        await interaction.reply({
            embeds: [ErrorMessage(
                "Command Error",
                "Please provide a group name"
            )]
        });
        return;
    }

    const groupData = groups[group as keyof typeof groups];

    if (!groupData) {
        await interaction.reply({
            embeds: [ErrorMessage(
                "Command Error",
                "Group not found"
            )]
        });
        return;
    }

    const ranks = Object.entries(groupData.Ranks).map(([rankId, name]) => `${rankId}. ${name}`);

    const embed = new EmbedBuilder()
        .setTitle(`${group}`)
        .addFields([
            {
                name: "Ranks",
                value: ranks.join("\n")
            }
        ])
    
    await interaction.reply({
        embeds: [embed]
    });
        
}

const command = BuildCommand(commandData, execute);

module.exports = command;