import { Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common";
import * as schema from "./schema";
import { createClient } from "@libsql/client";

export const DRIZZLE = Symbol("Drizzle Connection");

@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        const client = createClient({
          url: env.DATABASE_URL,
        });

        const db = drizzle(client, { schema }) as LibSQLDatabase<typeof schema>;

        try {
          await db.run(`
            CREATE TABLE \`endpoints\` (
              \`id\` text PRIMARY KEY NOT NULL,
              \`name\` text NOT NULL,
              \`description\` text,
              \`method\` text NOT NULL,
              \`url\` text NOT NULL,
              \`headers\` text,
              \`body\` text,
              \`parameters\` text,
              \`pre_processors\` text,
              \`post_processors\` text,
              \`created_at\` text NOT NULL,
              \`updated_at\` text NOT NULL
            );

            CREATE UNIQUE INDEX \`project_endpoints_path_idx\` ON \`endpoints\` (\`method\`,\`url\`);

            CREATE TABLE \`flow_runs\` (
              \`id\` text PRIMARY KEY NOT NULL,
              \`flow_id\` text NOT NULL,
              \`status\` text NOT NULL,
              \`latency\` real,
              \`success_rate\` real NOT NULL,
              \`throughput\` real,
              \`ccu\` integer,
              \`threads\` integer,
              \`started_at\` text NOT NULL,
              \`completed_at\` text,
              \`note\` text,
              FOREIGN KEY (\`flow_id\`) REFERENCES \`flows\`(\`id\`) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE \`flow_steps\` (
              \`id\` text PRIMARY KEY NOT NULL,
              \`flow_id\` text NOT NULL,
              \`endpoint_id\` text NOT NULL,
              \`order\` integer NOT NULL,
              \`created_at\` text NOT NULL,
              \`updated_at\` text NOT NULL,
              FOREIGN KEY (\`flow_id\`) REFERENCES \`flows\`(\`id\`) ON UPDATE no action ON DELETE no action,
              FOREIGN KEY (\`endpoint_id\`) REFERENCES \`endpoints\`(\`id\`) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE \`flows\` (
              \`id\` text PRIMARY KEY NOT NULL,
              \`name\` text NOT NULL,
              \`description\` text,
              \`created_at\` text NOT NULL,
              \`updated_at\` text NOT NULL
            );

            CREATE TABLE \`variables\` (
              \`name\` text PRIMARY KEY NOT NULL,
              \`value\` text NOT NULL,
              \`created_at\` text NOT NULL,
              \`updated_at\` text NOT NULL
            );
          `);
        } catch (error) {
          console.log("Tables have already been created");
        }

        return db;
      }
    }
  ],
  exports: [DRIZZLE]
})
export class DrizzleModule { }
