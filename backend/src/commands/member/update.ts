// Member command: Update roles based on current group ranks 

import { ChatInputCommandInteraction, PermissionsBitField, GuildMemberRoleManager, GuildMember } from "discord.js";
import { Command, BuildCommand, OptionType, OptionData, CommandData } from "../../utility/command";
import { ErrorMessage } from "../../embeds/errorMessage";
import { SuccessfulRolesUpdate } from "../../embeds/rolesUpdated";
import { eq } from "drizzle-orm";
import Database from "@classes/database";
import Datastore from "@classes/Datastore";

type BindingOperation = "=" | ">=" | "<=" | "between";
interface Binding {
    serverId: string;
    operator: BindingOperation;
    rank: number;
    secondaryRank: number | null;
    roles: string[];
}

function evaluateOperation(targetRank: number, operation: BindingOperation, evalRank1: number, evalRank2: number | null) {
    switch (operation) {
        case "=":
            return targetRank === evalRank1;
        case ">=":
            return targetRank >= evalRank1;
        case "<=":
            return targetRank <= evalRank1;
        case "between":
            return targetRank >= evalRank1 && targetRank <= evalRank2!;
        default:
            return false;
    }
}

async function execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getMember("user");
    const interactionMember = interaction.member;
    let targetMember : GuildMember = interaction.member as GuildMember;

    interaction.deferReply({ephemeral: true});

    if (member) {

        const permissions = interactionMember?.permissions as PermissionsBitField;
        const roles = interactionMember?.roles as GuildMemberRoleManager;
        
        if (!permissions.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({
                embeds: [ErrorMessage(
                    "Command Error",
                    "You do not have permission to use this command on other members"
                )]
            });
            return;
        }

        targetMember = member as GuildMember;
    }

    const memberRoles = targetMember.roles as GuildMemberRoleManager;
    let userData = await Database.getUserByDiscord(targetMember.id);
    
    if (!userData) {
        await interaction.editReply({
            embeds: [ErrorMessage(
                "Command Error",
                "User is not linked to a Roblox account"
            )]
        });
        return;
    }

    const memberRobloxId = userData.robloxId;
    if (!memberRobloxId) {
        await interaction.editReply({
            embeds: [ErrorMessage(
                "Command Error",
                `${member == interaction.member ? "You are" : "The user is"} not linked to a Roblox account`
            )]
        });

        return;
    }

    const groupData = await Datastore.GetEntry(memberRobloxId);

    if (!groupData) {
        await interaction.editReply({
            embeds: [ErrorMessage(
                "Command Error",
                "User is not a member of any group"
            )]
        });
        return;
    }

    const addedRoles : string[] = [];
    const removedRoles : string[] = [];
    const guildId = interaction.guild?.id;

    const bindings: Binding[] = guildId ? await Database.pool.select().from(Database.bindings)
    .where(eq(Database.bindings.serverId, guildId)) as Binding[] : [];

    if (bindings.length === 0) {
        await interaction.editReply({
            embeds: [SuccessfulRolesUpdate(
                "Roles Updated",
                "No bindings found for this server",
                [],
                []
            )]
        });
        return;
    }

    for (const groupBinding of bindings) {
        if (evaluateOperation(groupData.rankId, groupBinding.operator as BindingOperation, groupBinding.rank, groupBinding.secondaryRank)) {
            addedRoles.push(...groupBinding.roles);
        }
    }

    for (const [roleId] of memberRoles.cache) {
        if (!addedRoles.includes(roleId)) {
            removedRoles.push(roleId);
        }
    }

    await Promise.all([
        ...addedRoles.map(roleId => targetMember.roles.add(roleId)),
        ...removedRoles.map(roleId => targetMember.roles.remove(roleId))
    ]);

    await interaction.editReply({
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