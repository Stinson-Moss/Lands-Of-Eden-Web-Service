// Admin command: Update Tester roles

import { ChatInputCommandInteraction, GuildMember, MessageFlags, PermissionsBitField } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { SuccessMessage } from "@/embeds/successMessage";
import Database from "@/classes/database";
import DatastoreServer from "@/classes/datastore";
import PlayerData from "@utility/playerData"
import Groups from "@data/groups.json"
import setRank from "@/utility/setrank";

async function commandError(interaction: ChatInputCommandInteraction, message: string) {
    await interaction.editReply({
        embeds: [ErrorMessage("Command Error", message)]
    });
}

function canRankUser(setterRank: number, userRank: number, group: string, targetRank: number) {
    const groupData = Groups[group as keyof typeof Groups];

    return setterRank >= userRank
        && setterRank >= groupData.Classes.Officer
        && targetRank < setterRank;
}

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const rankSetter = interaction.member;
    const discordUser = interaction.options.getMember("user");
    const group = interaction.options.getString("group");
    const rank = interaction.options.getNumber("rank") ?? interaction.options.getString("rank");


    if (!group) {
        await commandError(interaction, "No group provided");
        return;
    }

    if (!Groups[group as keyof typeof Groups]) {
        await commandError(interaction, "Group does not exist");
        return;
    }

    if (!rank) {
        await commandError(interaction, "No rank provided");
        return;
    }

    if (!discordUser || (discordUser as GuildMember).id === interaction.user.id) {
        await commandError(interaction, "You cannot set your own rank");
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
        await commandError(interaction, "You are not linked to a roblox account");
        return;
    }

    const userInfo = await Database.getUserByDiscord((discordUser as GuildMember).id);

    if (!userInfo || !userInfo.robloxId) {
        await commandError(interaction, "The user is not linked to a roblox account");
        return;
    }

    try {
        
        const setterData : PlayerData = await DatastoreServer.GetDatastore("PlayerDataManager").GetEntry(setterInfo.robloxId);

        if (!setterData) {
            await commandError(interaction, "You have no data stored");
            return;
        }
        
        const userData : PlayerData = await DatastoreServer.GetDatastore("PlayerDataManager").GetEntry(userInfo.robloxId);
        
        if (!userData) {
            await commandError(interaction, "User has no data");
            
            return;
        }
        
        if (!canRankUser(setterData.Ranks[group], userData.Ranks[group], group, Number(rank))) {
            await commandError(interaction, "You do not have valid permissions to set this rank to this user");

            return;
        }

        if (!userData.Ranks[group]) {
            await commandError(interaction, "Group not found");

            return;
        }

        if (userData.Ranks[group] === 0) {
            await commandError(interaction, `User is not in the ${group} group.`);

            return;
        }

        if (userData.Ranks[group] === rank) {
            await commandError(interaction, "User already has this rank");

            return;
        }

        const setter = {
            robloxId: setterInfo.robloxId,
            data: setterData
        }

        const user = {
            robloxId: userInfo.robloxId,
            data: userData
        }

        await setRank(setter, user, group, Number(rank));

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
    name: "setrank",
    description: "Set a user's rank in a group",
    options: [
        {
            name: "group",
            description: "The group to update",
            type: OptionType.STRING,
            required: true
        },

        {
            name: "user",
            description: "The user to update",
            type: OptionType.USER,
            required: true
        },

        {
            name: "rank",
            description: "The rank to set",
            type: OptionType.NUMBER,
            required: true
        }
    ],

    cooldown: 5,
    permissions: PermissionsBitField.Flags.Administrator
}

const command: Command = BuildCommand(commandData, execute);
module.exports = command;