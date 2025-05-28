// create the schema for the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const connection = await mysql.createConnection({
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
    ca: fs.readFileSync(process.env.DB_CA || ''),
    rejectUnauthorized: true
  }
});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  discordId VARCHAR(32) NOT NULL,
  robloxId VARCHAR(32) NOT NULL,
  token VARCHAR(255),
  discordToken VARCHAR(255) NOT NULL,
  robloxToken TEXT,
  refreshToken VARCHAR(255),
  discordRefreshToken VARCHAR(255) NOT NULL,
  robloxRefreshToken TEXT,
  tokenExpires BIGINT,
  discordTokenExpires BIGINT NOT NULL,
  robloxTokenExpires BIGINT,

  PRIMARY KEY (discordId),
  INDEX(discordId),
  INDEX(robloxId),
  INDEX(token),
  INDEX(refreshToken)
)
`;

const bindingSchema = `
CREATE TABLE IF NOT EXISTS bindings (
  guildId VARCHAR(255) NOT NULL,
  settings JSON
)`;


async function createSchema() {
  await (await connection).execute(schema);
}

async function changeSchema() {
  await (await connection).execute(`
    ALTER TABLE users
    MODIFY discordId VARCHAR(32) NOT NULL,
    MODIFY robloxId VARCHAR(32) NOT NULL,
  
    MODIFY token VARCHAR(512),
    MODIFY refreshToken VARCHAR(512),
    MODIFY tokenExpires BIGINT UNSIGNED,
    
    MODIFY discordToken VARCHAR(512) NOT NULL,
    MODIFY discordRefreshToken VARCHAR(512) NOT NULL,
    MODIFY discordTokenExpires BIGINT UNSIGNED NOT NULL,
    
    MODIFY robloxToken TEXT,
    MODIFY robloxRefreshToken TEXT,
    MODIFY robloxTokenExpires BIGINT UNSIGNED;
  `);

  connection.end();
}

async function clear() {
  await (await connection).execute(`
    DELETE FROM users
  `);
}

async function test() {
  let [rows] = await (await connection).execute(`
    SELECT * FROM users
  `);

  console.log(`CURRENT: ${JSON.stringify(rows)}`);

  // Add dummy data
  await (await connection).execute(`
    INSERT INTO users (discordId, robloxId, token, discordToken, robloxToken, refreshToken, discordRefreshToken, robloxRefreshToken, tokenExpires, discordTokenExpires, robloxTokenExpires)
    VALUES ('1234567890', '1234567890', '1234567890', '1234567890', '1234567890', '1234567890', '1234567890', '1234567890', 1234567890, 1234567890, 1234567890)
  `);
  
  console.log('Added dummy data');

  [rows] = await (await connection).execute(`
    SELECT * FROM users
  `);

  console.log(`AFTER: ${JSON.stringify(rows)}`);

  await (await connection).execute(`
    DELETE FROM users
  `);

  [rows] = await (await connection).execute(`
    SELECT * FROM users
  `);

  console.log('Deleted dummy data');
  console.log(`AFTER: ${JSON.stringify(rows)}`);

  await (await connection).end();
}

async function main() {
  await clear();
  await test();
}

async function printDatabase() {
  let [rows] = await (await connection).execute(`
    SELECT * FROM users
  `);

  console.log(JSON.stringify(rows));
}

// main().catch(err => {
//   console.error(err);
//   connection.end();
// });

changeSchema().catch(err => {
  console.error(err);
  connection.end();
});

// printDatabase().catch(err => {
//   console.error(err);
// }).finally(() => {
//   connection.end();
// });

