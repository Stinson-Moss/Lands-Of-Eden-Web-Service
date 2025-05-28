import { EmbedBuilder } from "discord.js";

function ErrorMessage(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0xED4245)
        .setTimestamp(Date.now())
        .setFooter({
            text: "Adam"
        });
}

export {ErrorMessage};