// Admin command: Update Tester roles

import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, PermissionsBitField } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { SuccessMessage } from "@/embeds/successMessage";
import Database from "@/classes/database";
import Datastore from "@/classes/Datastore";
import PlayerData from "@utility/playerData"
import Groups from "@data/groups.json"
import axios from "axios";

const EDEN_GROUP = process.env.ROBLOX_GROUP_ID;
const TESTER_ROLE = process.env.DISCORD_ARCHITECTS_TESTER;
const TESTER_RANK = process.env.EDEN_TESTER_ID;
const SUBJECT_RANK = process.env.EDEN_SUBJECT_ID;

function canRankUser(setterRank: number, userRank: number, group: string, targetRank: number) {
    const groupData = Groups[group as keyof typeof Groups];

    return setterRank >= userRank
        && setterRank >= groupData.Classes.Officer
        && targetRank < setterRank;
}

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const rankSetter = interaction.member;
    const discordUser = interaction.options.getMember("user");
    const group = interaction.options.getString("group");
    const rank = interaction.options.getNumber("rank") ?? interaction.options.getString("rank");


    if (!group) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "No group provided")]
        });

        return;
    }

    if (!Groups[group as keyof typeof Groups]) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "Group does not exist")]
        });

        return;
    }

    if (!rank) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "No rank provided")]
        });

        return;
    }

    if (!discordUser || (discordUser as GuildMember).id === interaction.user.id) {
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
    
    const setterInfo = await Database.getUserByDiscord((rankSetter as GuildMember).id);

    if (!setterInfo || !setterInfo.robloxId) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "You are not linked to a roblox account")]
        });

        return;
    }

    const userInfo = await Database.getUserByDiscord((discordUser as GuildMember).id);

    if (!userInfo || !userInfo.robloxId) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "The user is not linked to a roblox account")]
        });
        return;
    }

    try {
        
        const setterData : PlayerData = await Datastore.GetEntry(setterInfo.robloxId);

        if (!setterData) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "You must be linked to a roblox account to use this command")]
            });

            return;
        }

        
        const userData : PlayerData = await Datastore.GetEntry(userInfo.robloxId);
        
        if (!userData) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "User has no data")]
            });
            
            return;
        }
        
        if (!canRankUser(setterData.Ranks[group], userData.Ranks[group], group, Number(rank))) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "You do not have valid permissions to set this rank to this user")]
            });

            return;
        }

        if (!userData.Ranks[group]) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "Group not found")]
            });

            return;
        }

        if (userData.Ranks[group] === rank) {
            await interaction.editReply({
                embeds: [ErrorMessage("Command Error", "User already has this rank")]
            });

            return;
        }

        userData.Ranks[group] = Number(rank);


        // check if the user is ingame, if so, use messaging service, if not, update the datastore

        if (false) {

        } else {

            const result =  Datastore.UpdateEntry(userInfo.robloxId, userData);
        }

        await interaction.editReply({
            embeds: [SuccessMessage("Command Success", "User rank updated")]
        });
    } catch (error) {
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "Failed to update rank")]
        });
    }
}

const commandData: CommandData = {
    name: "updateTester",
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