import { Client } from "discord.js";

class DiscordClient extends Client {
    static client: Client;

    static setClient(newClient: Client) {
        DiscordClient.client = newClient;
    }
}

export default DiscordClient;