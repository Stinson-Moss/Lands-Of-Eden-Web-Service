import { pgTable, serial, varchar, text, integer, jsonb, index } from "drizzle-orm/pg-core"

const users = pgTable("users", {
    discordId: varchar("discordId", { length: 20 }).primaryKey().notNull(),
    robloxId: varchar("robloxId", { length: 20 }).unique(),
    
    token: text("token"),
    discordToken: text("discordToken"),
    
    refreshToken: text("refreshToken"),
    discordRefreshToken: text("discordRefreshToken"),
    
    tokenExpires: integer("tokenExpires"),
    discordTokenExpires: integer("discordTokenExpires"),
    
}, (table) => [
    index('tokenIdx').on(table.token),
]);

const bindings = pgTable("bindings", {
    id: serial("id").primaryKey(),
    serverId: varchar("serverId", { length: 20 }).notNull(),
    groupName: varchar("groupName", { length: 50 }).notNull(),
    rank: integer("rank").notNull(),
    secondaryRank: integer("secondaryRank"),
    operator: varchar("operator", { length: 10 }).notNull(),
    roles: jsonb("roles").notNull(),
}, (table) => [
    index('serverIdIdx').on(table.serverId),
]);

export { users, bindings };
