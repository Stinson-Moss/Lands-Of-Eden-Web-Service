import mysql, { RowDataPacket, FieldPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config({path: `.env.${process.env.NODE_ENV}`});

const pathToCA = path.join(process.cwd(), process.env.DB_CA as string)

class Database {
    private static pool: mysql.Pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        port: parseInt(process.env.DB_PORT || '3306'),

        ssl: {
            ca: fs.readFileSync(pathToCA),
            rejectUnauthorized: true
        }
    });

    static async query(sql: string, params: any[] = []): Promise<[RowDataPacket[], FieldPacket[]]> {
       return await this.pool.query(sql, params);
    }

    static async close() {
        await this.pool.end();
    }

    static async getUserByDiscord(discordId : string) {
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE discordId = ?', [discordId]);
        return (rows as any)[0];
      }
      
    static async getUserByRoblox(robloxId : string) {
        const [rows] = await this.pool.execute('SELECT * FROM users WHERE robloxId = ?', [robloxId]);
        console.log(rows);
        return (rows as any)[0];
      }
      
    // GROUP BINDINGS
    static async addGroupBinding(guildId : string, groupId : string, rankId : string, roleId : string) {
        return this.pool.execute(
            'INSERT INTO group_bindings (guildId, groupId, rankId, roleId) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE roleId = VALUES(roleId)',
            [guildId, groupId, rankId, roleId]
        );
    }
    static async removeGroupBinding(guildId : string, groupId : string, rankId : string, roleId : string) {
        return this.pool.execute(
            'DELETE FROM group_bindings WHERE guildId = ? AND groupId = ? AND rankId = ? AND roleId = ?',
            [guildId, groupId, rankId, roleId]
        );
    }
    static async getGroupBindings(guildId : string, group : string) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM group_bindings WHERE guildId = ? AND group = ?',
            [guildId, group]
        );
        return (rows as any).map((row : any) => row.json());
    }
    
    // AUDIT LOGS
    static async addAuditLog(guildId : string, groupId : string, actionType : string, performerId : string, targetId : string, oldRankId : string, newRankId : string) {
        return this.pool.execute(
            'INSERT INTO audit_logs (guildId, groupId, actionType, performerId, targetId, oldRankId, newRankId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [guildId, groupId, actionType, performerId, targetId, oldRankId, newRankId]
        );
    }
    static async getAuditLogs(guildId : string, groupId : string, limit = 20) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM audit_logs WHERE guildId = ? AND groupId = ? ORDER BY performedAt DESC LIMIT ?',
            [guildId, groupId, limit]
        );
        
        return (rows as RowDataPacket[]).map(row => row.json());
    }
}


export default Database;