import { drizzle } from "drizzle-orm/node-postgres"
import { eq } from "drizzle-orm"
import { users, bindings} from "../db/schema";
import {Pool} from 'pg';
import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config({path: `.env.${process.env.NODE_ENV}`});      

const pathToCA = path.join(process.cwd(), process.env.DB_CA as string)

let pool: Pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
        ca: fs.readFileSync(pathToCA),
        rejectUnauthorized: true,
    }
});

class Database {

    private static Instance = drizzle(pool);

    static users = users;
    static bindings = bindings;

    static transaction: typeof this.Instance.transaction = this.Instance.transaction;
    static select: typeof this.Instance.select = this.Instance.select;
    static insert: typeof this.Instance.insert = this.Instance.insert;
    static update: typeof this.Instance.update = this.Instance.update;
    static delete: typeof this.Instance.delete = this.Instance.delete;

    static async getUserByDiscord(discordId : string) {
        const result = await this.Instance.select()
        .from(users).where(eq(users.discordId, discordId));

        return result[0];
    }
      
    static async getUserByRoblox(robloxId : string) {
        const result = await this.Instance.select()
        .from(users).where(eq(users.robloxId, robloxId));

        return result[0];
    }


}

export default Database;