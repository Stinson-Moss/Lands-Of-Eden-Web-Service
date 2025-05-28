import Role from "./Role";

interface Server {
    id: string;
    name: string;
    icon: string;
    memberCount: number;
    roles: Role[];
}

export default Server;