// Member command: Get user information 

import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, MessageFlags } from "discord.js";
import { Command, BuildCommand, OptionType, CommandData } from "@/utility/command";
import { ErrorMessage } from "@/embeds/errorMessage";
import { UserInfoEmbed } from "@/embeds/userInfo";
import { getUserInfo, UserIdType, UserInfo } from "@/classes/getRobloxUserInfo";

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const discordUser = interaction.options.getMember("user_discord");
    const robloxUser = interaction.options.getString("user_roblox");

    if (robloxUser && discordUser) {
        await interaction.editReply({
            embeds: [ErrorMessage(
                "Command Error",
                "You cannot provide both a discord user and a roblox id"
            )]
        });

        return;
    }

    let userId = robloxUser ?? (discordUser as GuildMember)?.id ?? (interaction.member as GuildMember)?.id;
    let type = robloxUser ? UserIdType.Roblox : UserIdType.Discord;

    if (robloxUser) {
        const pattern = /^\d+$/;
        const robloxId = robloxUser.match(pattern)?.[0];
        if (!robloxId) {
            await interaction.editReply({
                embeds: [ErrorMessage(
                    "Command Error",
                    "Invalid roblox id"
                )]
            })
            return;
        }

    }

    // if (discordUser) {
    //     if (!((discordUser.roles as GuildMemberRoleManager).cache.has(process.env.ROLE_LINKED as string))) {
    //         await interaction.editReply({
    //             embeds: [ErrorMessage(
    //                 "Not Found",
    //                 "User does not have a linked roblox account"
    //             )]
    //         });

    //         return;
    //     }
    // }

    let userInfo: UserInfo;
    try {
        userInfo = await getUserInfo(userId, type);
        console.log('UserInfo:', userInfo);
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "User not found")]
        });
        return;
    }
    
    try {
        const embed = await UserInfoEmbed(userInfo);

        await interaction.editReply({
            embeds: [embed],
            allowedMentions: {
                users: []
            }
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            embeds: [ErrorMessage("Command Error", "Error fetching user information")]
        });
    }
}

const commandData: CommandData = {
    name: "info",
    description: "Get user information",
    options: [
        {
            name: "user_discord",
            description: "The user to get information about",
            type: OptionType.USER,
            required: false
        },

        {
            name: "user_roblox",
            description: "The roblox id to get information about",
            type: OptionType.STRING,
            required: false
        }
    ],

    cooldown: 10
}

const command: Command = BuildCommand(commandData, execute);

module.exports = command;