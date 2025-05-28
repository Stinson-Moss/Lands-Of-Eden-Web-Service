// Member command: View ranks in a specific group 
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { BuildCommand, CommandData, OptionType } from "../../utility/command";
import { ErrorMessage } from "../../embeds/errorMessage";
import Datastore from "../../classes/Datastore";

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

    const groupData = await Datastore.GetEntry(group);
    
    
    if (!groupData) {
        await interaction.reply({
            embeds: [ErrorMessage(
                "Command Error",
                "Group not found"
            )]
        });
        return;
    }
    
    const groupInfo = groupData.json();
    const ranks = groupInfo.Ranks.map((rank: any, index: any) => `**Rank ${index + 1}**: ${rank}`);

    const embed = new EmbedBuilder()
        .setTitle(`${group} Ranks`)
        .addFields([
            {
                name: "Ranks",
                value: ranks.join("\n"),
                inline: true
            }
        ])
    
    await interaction.reply({
        embeds: [embed]
    });
        
}

const command = BuildCommand(commandData, execute);

module.exports = command;