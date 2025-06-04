import {ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

enum OptionType {
    INTEGER = 1,
    NUMBER = 2,
    STRING = 3,
    BOOLEAN = 4,
    USER = 5,
    CHANNEL = 6,
    ROLE = 7,
    MENTIONABLE = 8,
    ATTACHMENT = 9,
}

interface Command {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

interface CommandData {
    name: string;
    description: string;
    options?: any[];
    subcommands?: CommandData[];
    permissions?: bigint;
}

interface OptionData {
    name: string;
    description: string;
    type: OptionType;
    required: boolean;
}

function BuildSubCommand(data: CommandData): SlashCommandSubcommandBuilder {
    const subcommand = new SlashCommandSubcommandBuilder()
        .setName(data.name)
        .setDescription(data.description)

    if (data.options) {
        for (const optionData of data.options) {
            const buildOption = (option: any) => {
                option.setName(optionData.name)
                    .setDescription(optionData.description)
                    .setRequired(optionData.required);
                return option;
            }

            switch (optionData.type) {
                case OptionType.STRING:
                    subcommand.addStringOption(buildOption);
                    break;
                case OptionType.INTEGER:
                    subcommand.addIntegerOption(buildOption);
                    break;
                case OptionType.NUMBER:
                    subcommand.addNumberOption(buildOption);
                    break;
                case OptionType.BOOLEAN:
                    subcommand.addBooleanOption(buildOption);
                    break;
                case OptionType.USER:
                    subcommand.addUserOption(buildOption);
                    break;
                case OptionType.CHANNEL:
                    subcommand.addChannelOption(buildOption);
                    break;
                case OptionType.ROLE:
                    subcommand.addRoleOption(buildOption);
                    break;
                case OptionType.MENTIONABLE:
                    subcommand.addMentionableOption(buildOption);
                    break;
                case OptionType.ATTACHMENT:
                    subcommand.addAttachmentOption(buildOption);
                    break;
                default:
                    throw new Error(`Invalid option type: ${optionData.type}`);
            }
        }
    }

    return subcommand;
}

function BuildCommand(data: CommandData, execute: (interaction: ChatInputCommandInteraction) => Promise<void>): Command {
    const slashCommand = new SlashCommandBuilder()
        .setName(data.name)
        .setDescription(data.description)
        .setDefaultMemberPermissions(data.permissions ?? PermissionsBitField.Default);

    if (data.options) {
        for (const optionData of data.options) {
            const buildOption = (option: any) => {
                option.setName(optionData.name)
                    .setDescription(optionData.description)
                    .setRequired(optionData.required);
                return option;
            }

            switch (optionData.type) {
                case OptionType.STRING:
                    slashCommand.addStringOption(buildOption);
                    break;
                case OptionType.INTEGER:
                    slashCommand.addIntegerOption(buildOption);
                    break;
                case OptionType.NUMBER:
                    slashCommand.addNumberOption(buildOption);
                    break;
                case OptionType.BOOLEAN:
                    slashCommand.addBooleanOption(buildOption);
                    break;
                case OptionType.USER:
                    slashCommand.addUserOption(buildOption);
                    break;
                case OptionType.CHANNEL:
                    slashCommand.addChannelOption(buildOption);
                    break;
                case OptionType.ROLE:
                    slashCommand.addRoleOption(buildOption);
                    break;
                case OptionType.MENTIONABLE:
                    slashCommand.addMentionableOption(buildOption);
                    break;
                case OptionType.ATTACHMENT:
                    slashCommand.addAttachmentOption(buildOption);
                    break;
                default:
                    throw new Error(`Invalid option type: ${optionData.type}`);
            }
        }
    }
    
    if (data.subcommands) {
        for (const subcommand of data.subcommands) {
            slashCommand.addSubcommand(BuildSubCommand(subcommand));
        }
    }

    return {
        "data": slashCommand,
        "execute": execute
    }
}

export {OptionType, OptionData, Command, CommandData, BuildCommand};