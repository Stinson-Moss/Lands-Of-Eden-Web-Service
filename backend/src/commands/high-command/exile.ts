// Exile a user from a group

import { ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import { CommandData, Command, BuildCommand, OptionType } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { SuccessMessage } from "@/embeds/successMessage";
import axios from "axios";
import Groups from "@data/groups.json";
import Database from "@/classes/database";
import DatastoreServer from "@/classes/datastore";
import setRank from "@/utility/setrank";

const usersUrl = `https://users.roblox.com/v1/usernames/users`

const commandData: CommandData = {
    name: "exile",
    description: "Exile a user from a group",
    options: [
        {
            name: "group",
            description: "The group to exile the user from",
            type: OptionType.STRING,
            required: true,
            choices: Object.keys(Groups).map(group => ({ name: group, value: group }))
        },
        {
            name: "user_roblox",
            description: "The roblox username or id of the user to exile",
            type: OptionType.STRING,
            required: false
        },
        {
            name: "user_discord",
            description: "The discord id of the user to exile",
            type: OptionType.USER,
            required: false
        }
    ],

    cooldown: 5,
}

async function error(interaction: ChatInputCommandInteraction, message: string) {
    await interaction.editReply({
        embeds: [ErrorMessage("Error", message)]
    });
}

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const groupOption = interaction.options.getString("group");
    const robloxOption = interaction.options.getString("user_roblox");
    const discordOption = interaction.options.getMember("user_discord");

    let robloxUser: { id: string | null, username: string | null } = {
        id: null,
        username: null
    };

    const groupData = Groups[groupOption as keyof typeof Groups];

    if (!groupData) {
        await error(interaction, "Group not found");
        return;
    }

    if (!robloxOption && !discordOption) {
        await error(interaction, "No user provided");
        return;
    }

    try {
        
        const setterInfo = await Database.getUserByDiscord((interaction.member as GuildMember).id)
        if (!setterInfo || !setterInfo.robloxId) {
            await error(interaction, "You are not linked to a roblox account");
            return;
        }
    
        const setterData = await DatastoreServer.GetDatastore("PlayerDataManager").GetEntry(setterInfo.robloxId);
        if (!setterData) {
            await error(interaction, "You have no data stored");
            return;
        }
    
        if (setterData.Ranks[groupOption as keyof typeof setterData.Ranks] < groupData.Classes.Command) {
            await error(interaction, `You must be at least ${groupData.Ranks[groupData.Classes.Command.toString() as keyof typeof groupData.Ranks]} (${groupData.Classes.Command}) to process invites for the ${groupOption}`);
            return;
        }
    
        if (robloxOption) {
            let robloxId = robloxOption.match(/^(\d+)$/)?.[0];
            if (!robloxId) {
                const robloxUsers = await axios.post(usersUrl, {
                    usernames: [robloxOption],
                    excludeBannedUsers: true
                })
    
                if (robloxUsers.data.data.length === 0) {
                    await error(interaction, "User not found");
                    return;
                }
    
                robloxId = robloxUsers.data.data[0].id;
                robloxUser.id = robloxId as string;
                // robloxUser.username = robloxUsers.data.data[0].name;
            }
        } else {
            const userInfo = await Database.getUserByDiscord((discordOption as GuildMember).id)
            if (!userInfo || !userInfo.robloxId) {
                await error(interaction, "User is not linked to a roblox account");
                return;
            }
            
            robloxUser.id = userInfo.robloxId;
        }
    
        const userData = await DatastoreServer.GetDatastore("PlayerDataManager").GetEntry(robloxUser.id as string);
        if (!userData) {
            await error(interaction, "User has no data stored");
            return;
        }
    
        if (userData.Ranks[groupOption as keyof typeof userData.Ranks] === 0) {
            await error(interaction, "User is not a member of the group");
            return;
        }
        
        const setterUser = {
            robloxId: setterInfo.robloxId,
            data: setterData
        }
    
        const targetUser = {
            robloxId: robloxUser.id as string,
            data: userData
        }
        
        await setRank(setterUser, targetUser, groupOption as string, 0);
        await interaction.editReply({
            embeds: [SuccessMessage("Success", `User has been exiled from ${groupOption}`)]
        });
        
    } catch (e) {
        console.error(e);
        await error(interaction, "Failed to process exile");
        return;
    }
}

module.exports = BuildCommand(commandData, execute);