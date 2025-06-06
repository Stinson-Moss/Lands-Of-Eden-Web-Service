// Admin command: Update Tester roles

import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, PermissionsBitField } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { SuccessMessage } from "@/embeds/successMessage";
import Database from "@/classes/database";
import axios from "axios";

const EDEN_GROUP = process.env.ROBLOX_GROUP_ID;
const TESTER_ROLE = process.env.DISCORD_ARCHITECTS_TESTER;
const TESTER_RANK = process.env.EDEN_TESTER_ID;
const SUBJECT_RANK = process.env.EDEN_SUBJECT_ID;

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const discordUser = interaction.options.getMember("user") ?? interaction.member;

    if (!discordUser) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "No user provided")]
        });

        return;
    }

    // if (!((discordUser.roles as GuildMemberRoleManager).cache.has(process.env.ROLE_LINKED as string))) {
    //     await interaction.editReply({
    //         embeds: [ErrorMessage(
    //             "Not Found",
    //             "User does not have a linked roblox account"
    //         )]
    //     });

    //     return;
    // }
    
    const userInfo = await Database.getUserByDiscord((discordUser as GuildMember).id);
    const isSelf : boolean = (discordUser as GuildMember).id === interaction.user.id;

    if (!userInfo || !userInfo.robloxId) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", isSelf ? "You are not linked to a roblox account" : "The user is not linked to a roblox account")]
        });
        return;
    }

    try {
        
        const params = new URLSearchParams({
            maxPageSize: "1",
            filter: `user == 'users/${userInfo.robloxId}'`
        });

        const response = await axios.get(`apis.roblox.com/cloud/v2/groups/${EDEN_GROUP}/memberships/${userInfo.robloxId}`, {
            headers: {
                "x-api-key": process.env.ROBLOX_GROUP_MANAGE_API_KEY
            }
        });
        
        const membership = response.data.groupMemberships[0];
        if (!membership) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "User is not a member of the group")]
            });
            return;
        }

        const memberRoleId = membership.role.match(/\d+$/)?.[0];

        if ((discordUser.roles as GuildMemberRoleManager).cache.has(TESTER_ROLE as string)) {
            if (memberRoleId === SUBJECT_RANK) {
                const rankResonse = await axios.patch(`apis.roblox.com/cloud/v2/groups/${EDEN_GROUP}/memberships/${userInfo.robloxId}`, {
                    role: TESTER_RANK
                }, {
                    headers: {
                        "x-api-key": process.env.ROBLOX_GROUP_MANAGE_API_KEY
                    }
                })
            } else {
                await interaction.editReply({
                    embeds: [ErrorMessage("Command Error", "User is above the tester rank")]
                });
                return;
            }
        } else {
            if (memberRoleId === TESTER_RANK) {
                await axios.patch(`apis.roblox.com/cloud/v2/groups/${EDEN_GROUP}/memberships/${userInfo.robloxId}`, {
                    role: SUBJECT_RANK
                }, {
                    headers: {
                        "x-api-key": process.env.ROBLOX_GROUP_MANAGE_API_KEY
                    }
                });    
            } 
            
        }
        
        await interaction.editReply({
            embeds: [SuccessMessage("Command Success", "User rank updated")]
        });
    } catch (error) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "An error occurred")]
        });
    }
}

const commandData: CommandData = {
    name: "updatetester",
    description: "Update a user's rank in the Eden Group",
    options: [
        {
            name: "user",
            description: "The user to update",
            type: OptionType.USER,
            required: true
        }
    ],

    permissions: PermissionsBitField.Flags.Administrator
}

const command: Command = BuildCommand(commandData, execute);

module.exports = command;