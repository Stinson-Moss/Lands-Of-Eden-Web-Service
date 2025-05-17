export interface Session {
    token: string;
    refreshToken: string;
    expiresIn: number;
}

export interface User {
    discord: {
        username: string;
        avatar: string;
        id: string;
    };
    roblox: {
        username: string;
        displayname: string;
        avatar: string;
    } | null;
}
