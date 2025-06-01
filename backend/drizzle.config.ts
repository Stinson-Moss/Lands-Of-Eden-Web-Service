import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

export default {
  schema: "src/db/schema.ts",
  out: "migrations",
  dbCredentials: {
    url: process.env.DB_URI!,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  dialect: "postgresql",
} satisfies Config;