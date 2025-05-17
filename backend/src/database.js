// create the schema for the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: {
    ca: fs.readFileSync(process.env.DB_CA || ''),
    rejectUnauthorized: true
  }

});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  discordId VARCHAR(255) NOT NULL,
  robloxId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  discordToken VARCHAR(255) NOT NULL,
  robloxToken VARCHAR(255) NOT NULL,
  refreshToken VARCHAR(255) NOT NULL,
  discordRefreshToken VARCHAR(255) NOT NULL,
  robloxRefreshToken VARCHAR(255) NOT NULL,
  tokenExpires INT NOT NULL,
  discordTokenExpires INT NOT NULL,
  robloxTokenExpires INT NOT NULL,

  PRIMARY KEY (discordId, robloxId),
  INDEX(discordId),
  INDEX(robloxId),
  INDEX(token),
  INDEX(refreshToken)
)
`;

async function createSchema() {
  await (await connection).execute(schema);
}

async function main() {
  await createSchema();

  console.log('Creating schema...');
  
  const [rows] = await (await connection).execute('SELECT * FROM users');
  console.log(rows);

  await (await connection).end();
}

main().catch(console.error);

