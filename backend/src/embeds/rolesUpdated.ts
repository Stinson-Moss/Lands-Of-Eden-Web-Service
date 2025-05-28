import { EmbedBuilder } from "discord.js";

function SuccessfulRolesUpdate(title: string, description: string, addedRoles: string[], removedRoles: string[]) {
    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle(title)
        .setDescription(description)
        .addFields(
            {
                name: "Added Roles",
                value: addedRoles.join("\n"),
                inline: true
            },
            {
                name: "Removed Roles",
                value: removedRoles.join("\n"),
                inline: true
            }
        )

    return embed;
}

export { SuccessfulRolesUpdate };
