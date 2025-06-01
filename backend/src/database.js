// create the schema for the database
import {Pool} from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '5432'),

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

  PRIMARY KEY (discordId)
);

CREATE INDEX IF NOT EXISTS users_discord_id_idx ON users(discordId);
CREATE INDEX IF NOT EXISTS users_roblox_id_idx ON users(robloxId);
CREATE INDEX IF NOT EXISTS users_token_idx ON users(token);
CREATE INDEX IF NOT EXISTS users_refresh_token_idx ON users(refreshToken);
`;

const bindingSchema = `
CREATE TABLE IF NOT EXISTS bindings (
  serverId VARCHAR(20) NOT NULL PRIMARY KEY,
  bindingSettings JSONB
)`;

async function createSchema() {
  await pool.query(schema);
}

async function createBindingSchema() {
  await pool.query(bindingSchema);
}

async function changeSchema() {
  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN robloxId TYPE VARCHAR(32);
  `);
}

async function changeBindingSchema() {
  await pool.query(`
    ALTER TABLE bindings
    DROP COLUMN bindingSettings,
    DROP CONSTRAINT bindings_pkey,
    ADD COLUMN id SERIAL PRIMARY KEY,
    ADD COLUMN "groupName" VARCHAR(50) NOT NULL,
    ADD COLUMN rank INT NOT NULL,
    ADD COLUMN secondaryRank INT,
    ADD COLUMN operator VARCHAR(10) NOT NULL,
    ADD COLUMN roles JSONB NOT NULL
  `);

  // Create indexes separately
  await pool.query(`
    CREATE INDEX IF NOT EXISTS bindings_group_name_idx ON bindings("groupName");
    CREATE INDEX IF NOT EXISTS bindings_server_id_idx ON bindings(serverId);
  `);
}

async function clear() {
  await pool.query(`DELETE FROM users`);
}

async function test() {
  const result = await pool.query(`SELECT * FROM users`);
  console.log(`CURRENT: ${JSON.stringify(result.rows)}`);

  // Add dummy data
  await pool.query(`
    INSERT INTO users (
      discordId, robloxId, token, discordToken, robloxToken, 
      refreshToken, discordRefreshToken, robloxRefreshToken, 
      tokenExpires, discordTokenExpires, robloxTokenExpires
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    '1234567890', '1234567890', '1234567890', '1234567890', '1234567890',
    '1234567890', '1234567890', '1234567890', 1234567890, 1234567890, 1234567890
  ]);
  
  console.log('Added dummy data');

  const result2 = await pool.query(`SELECT * FROM users`);
  console.log(`AFTER: ${JSON.stringify(result2.rows)}`);

  await pool.query(`DELETE FROM users`);

  const result3 = await pool.query(`SELECT * FROM users`);
  console.log('Deleted dummy data');
  console.log(`AFTER: ${JSON.stringify(result3.rows)}`);
}

async function main() {
  await clear();
  await test();
}

async function printDatabase() {
  const result = await pool.query(`SELECT * FROM users`);
  console.log(JSON.stringify(result.rows));
}

// Uncomment the function you want to run
// main().catch(err => {
//   console.error(err);
// });

// changeSchema().catch(err => {
//   console.error(err);
// });

// printDatabase().catch(err => {
//   console.error(err);
// });

// createBindingSchema().catch(err => {
//   console.error(err);
// });

changeBindingSchema().catch(err => {
  console.error(err);
});
