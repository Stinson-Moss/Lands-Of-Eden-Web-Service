import { drizzle } from "drizzle-orm/node-postgres"
import { eq } from "drizzle-orm"
import { users, bindings} from "../db/schema";
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
    dotenv.config({path: `.env.development`});      
} else {
    dotenv.config({path: '.env'});      
}

const pathToCA = path.join(process.cwd(), process.env.DB_CA as string)

let rawPool: Pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 18,
    ssl: {
        ca: fs.readFileSync(pathToCA),
        rejectUnauthorized: true,
    }
});

class Database {

    static pool = drizzle(rawPool, {
        schema: {
            users,
            bindings
        }
    });

    static users = users;
    static bindings = bindings;

    static async getUserByDiscord(discordId : string) {
        const result = await this.pool.select()
        .from(users).where(eq(users.discordId, discordId));

        return result[0];
    }
      
    static async getUserByRoblox(robloxId : string) {
        const result = await this.pool.select()
        .from(users).where(eq(users.robloxId, robloxId));

        return result[0];
    }
}

export default Database;