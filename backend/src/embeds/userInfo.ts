import { EmbedBuilder, ColorResolvable } from "discord.js";
import { UserInfo } from "../utility/getRobloxUserInfo";

function UserInfoEmbed(info: UserInfo) {
    return new EmbedBuilder()
        .setAuthor({
            name: `User ${info.id}`
        })
        .setColor(process.env.EDEN_COLOR as ColorResolvable)
        .setFields(
            {
                name: "Name",
                value: `[${info.displayName} (@${info.username})](https://roblox.com/users/${info.id}/profile)`
            },

            {
                name: "Discord User",
                value: `<@${info.discordId}>`
            },

            {
                name: "Groups",
                value: info.groups.join("\n")
            }
        )
        .setThumbnail(info.avatar)
}

export { UserInfoEmbed };