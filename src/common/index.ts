import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["production", "development"]).default("development"),
  APP_URL: z.string({ required_error: "APP_URL is required" }),

  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }),
  DATABASE_AUTH_TOKEN: z.string({ required_error: "DATABASE_AUTH_TOKEN is required" }),

  JWT_ACCESS_SECRET: z.string({ required_error: "ACCESS_SECRET is required" }),
  JWT_REFRESH_SECRET: z.string({ required_error: "REFRESH_SECRET is required" }),

  REDIS_HOST: z.string({ required_error: "REDIS_HOST is required" }),
  REDIS_PORT: z.coerce.number({ required_error: "REDIS_PORT is required" }),
  REDIS_PASSWORD: z.string({ required_error: "REDIS_PASSWORD is required" }),
});

export type Env = z.infer<typeof schema>;

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
