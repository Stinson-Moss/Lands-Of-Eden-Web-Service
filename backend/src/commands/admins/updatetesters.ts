// Admin command: Update Tester roles

import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, MessageFlags, PermissionsBitField } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { SuccessMessage } from "@/embeds/successMessage";
import Database from "@/classes/database";
import axios from "axios";
import DatastoreServer from "@/classes/datastore";

const DevelopmentDatastore = DatastoreServer.GetDatastore("Development");

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {

        const testers = await interaction.guild?.roles.cache.find(role => role.name === "Testers")?.members;

        const testerPromises = Array.from(testers?.values() || []).map(async (member) => {
            const user = await Database.getUserByDiscord(member.id);
            if (!user) return {
                discordId: member.id,
                robloxId: null
            };

            return {
                discordId: member.id,
                robloxId: user.robloxId
            };
        });

        const testerData = await Promise.all(testerPromises);
        const invalidTesters = testerData.filter(tester => tester.robloxId === null);
        const validTesters = testerData.filter(tester => tester.robloxId !== null);
        const newValue = validTesters.map(tester => tester.robloxId);
        const currentValue = await DevelopmentDatastore.GetEntry("Testers");
        const etag = currentValue?.etag;

        await DevelopmentDatastore.UpdateEntry("Testers", {value: newValue, etag: etag});
        
        await interaction.editReply({
            allowedMentions: {
                users: []
            },

            embeds: [SuccessMessage("Command Success", `Permission whitelist updated. ${invalidTesters.length > 0 && `Some testers were unable to be added to the whitelist due to not having a linked roblox account.`}`).addFields(
                {
                    name: "Valid Testers",
                    value: validTesters.map(tester => `<@${tester.discordId}>`).join("\n"),
                    inline: true
                }, 
                ...(invalidTesters.length > 0 ? [{
                        name: "Invalid Testers",
                        value: invalidTesters.map(tester => `<@${tester.discordId}>`).join("\n"),
                        inline: true
                    }] : [])
            )]
        });
    } catch (error) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "An error occurred")]
        });
    }
}

const commandData: CommandData = {
    name: "updatetesters",
    description: "Add new and remove old testers to permission whitelist",
    options: [
        {
            name: "user",
            description: "The user to update",
            type: OptionType.USER,
            required: true
        }
    ],

    cooldown: 30,
    permissions: PermissionsBitField.Flags.Administrator
}

const command: Command = BuildCommand(commandData, execute);

module.exports = command;