import "dotenv/config";
import { z } from "zod";
import os from "os";

const schema = z.object({
  PORT: z.coerce.number().default(31347),
  NODE_ENV: z.enum(["production", "development"]).default("development"),
  DATABASE_URL: z.string()
    .startsWith("file:", "Try adding 'file:' to resolve")
    .default(`file:${os.homedir()}/StressPilot/data/local.db`),
  APP_URL: z.string().default("http://localhost:1420"),
  APP_NAME: z.string({ required_error: "APP_NAME is required" }).default("StressPilot"),
});

export type Env = z.infer<typeof schema>;

// Input
let parsed: Env;
try {
  parsed = schema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(error.errors, null, 2),
    );
  } else {
    console.error("❌ Error parsing environment variables:", error);
  }
  process.exit(1);
}

const env = {
  ...parsed,
};

export default env;
