// create the schema for the database

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

