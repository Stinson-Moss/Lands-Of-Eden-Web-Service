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
})

console.log(connection);

const schema = `
CREATE TABLE IF NOT EXISTS users (
  discordId VARCHAR(255) NOT NULL,
  robloxId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  discordToken VARCHAR(255) NOT NULL,
  robloxToken TEXT,
  refreshToken VARCHAR(255) NOT NULL,
  discordRefreshToken VARCHAR(255) NOT NULL,
  robloxRefreshToken TEXT,
  tokenExpires BIGINT NOT NULL,
  discordTokenExpires BIGINT NOT NULL,
  robloxTokenExpires BIGINT,

  PRIMARY KEY (discordId),
  INDEX(discordId),
  INDEX(robloxId),
  INDEX(token),
  INDEX(refreshToken)
)
`;

async function createSchema() {
  await (await connection).execute(schema);
}

async function changeSchema() {
  await (await connection).execute(`
    ALTER TABLE users
    MODIFY COLUMN robloxToken TEXT NULL,
    MODIFY COLUMN robloxRefreshToken TEXT NULL
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

// main().catch(err => {
//   console.error(err);
//   connection.end();
// });

changeSchema().catch(err => {
  console.error(err);
  connection.end();
});

