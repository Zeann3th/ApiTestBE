import "dotenv/config";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(31347),
  NODE_ENV: z.enum(["production", "development"]).default("development"),
  DATABASE_URL: z.string()
    .startsWith("file:", "Try adding 'file:' to resolve")
    .default("file:~/flowtest/data/local.db"),
  APP_URL: z.string().default("http://localhost:5173"),
  APP_NAME: z.string({ required_error: "APP_NAME is required" }),
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
