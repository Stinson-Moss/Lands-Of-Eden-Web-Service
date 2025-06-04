import { EmbedBuilder } from "discord.js";

function SuccessMessage(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x42ED42)
        .setTimestamp(Date.now())
        .setFooter({
            text: "Adam"
        });
}

export {SuccessMessage};