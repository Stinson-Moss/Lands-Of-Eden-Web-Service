// Member command: Update roles based on current group ranks 

import { ChatInputCommandInteraction, PermissionsBitField, GuildMemberRoleManager, GuildMember } from "discord.js";
import { Command, BuildCommand, OptionType, OptionData, CommandData } from "../../utility/command";
import { ErrorMessage } from "../../embeds/errorMessage";
import { SuccessfulRolesUpdate } from "../../embeds/rolesUpdated";
import Database from "../../classes/database";
import Datastore from "../../classes/Datastore";

async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember("user");
    const interactionMember = interaction.member;
    let targetMember : GuildMember = interaction.member as GuildMember;

    if (member) {

        const permissions = interactionMember?.permissions as PermissionsBitField;
        const roles = interactionMember?.roles as GuildMemberRoleManager;
        
        if (!permissions.has(PermissionsBitField.Flags.Administrator) && !roles.cache.has(process.env.ROLE_MODERATOR as string)) {
            await interaction.reply({
                embeds: [ErrorMessage(
                    "Command Error",
                    "You do not have permission to use this command"
                )]
            });
            return;
        }

        targetMember = member as GuildMember;
    }

    const memberRoles = targetMember.roles as GuildMemberRoleManager;
    let memberRobloxId = await Database.getUserByDiscord(targetMember.id);
    
    if (!memberRobloxId) {
        await interaction.reply({
            embeds: [ErrorMessage(
                "Command Error",
                "User is not linked to a Roblox account"
            )]
        });
        return;
    }

    memberRobloxId = memberRobloxId.robloxId;
    const groupData = await Datastore.GetEntry(memberRobloxId);

    if (!groupData) {
        await interaction.reply({
            embeds: [ErrorMessage(
                "Command Error",
                "User is not a member of any group"
            )]
        });
        return;
    }

    const addedRoles : any[] = [];
    const removedRoles : any[] = [];

    const bindingSettings = await Database.getGroupBindings(interaction.guild?.id ?? "", groupData.groupId);
    for (const groupBinding of bindingSettings.groups) {
        for (const [rankId, roles] of Object.entries(groupBinding)) {
            if (groupData.rankId === parseInt(rankId)) {
                for (const roleId of roles as any[]) {
                    if (!memberRoles.cache.has(roleId)) {
                        addedRoles.push(roleId);
                    }
                }
            } else {
                for (const roleId of roles as any[]) {
                    if (memberRoles.cache.has(roleId)) {
                        removedRoles.push(roleId);
                    }
                }
            }
        }
    }

    for (const roleId of addedRoles) {
        await targetMember.roles.add(roleId);
    }

    for (const roleId of removedRoles) {
        await targetMember.roles.remove(roleId);
    }

    await interaction.reply({
        embeds: [SuccessfulRolesUpdate(
            "Roles Updated",
            "Roles updated successfully",
            addedRoles,
            removedRoles
        )]
    });
}

const commandData: CommandData = {
    name: "update",
    description: "Update roles based on current group ranks",
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
    ]
}

const command: Command = BuildCommand(commandData, execute);

module.exports = command;