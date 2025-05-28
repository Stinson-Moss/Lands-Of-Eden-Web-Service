import { Client } from "discord.js";

class Roles {
    static client: Client;
    static roles: Map<string, string>;

    static setClient(client: Client) {
        this.client = client;
    }

    static addRole(roleName: string, roleId: string) {
        this.roles.set(roleName, roleId);
    }

}

export default Roles;