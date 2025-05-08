import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import env from "src/common";

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  }
});
