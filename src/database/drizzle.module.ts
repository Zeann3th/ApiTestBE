import { Logger, Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common/env";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as path from "path";
import * as fs from "fs";
import * as url from "url";

export const DRIZZLE = Symbol("Drizzle Connection");

@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        const logger = new Logger("DatabaseMigrator")

        const parsedUrl = new url.URL(env.DATABASE_URL);

        if (parsedUrl.protocol === "file:") {
          const dbPath = parsedUrl.pathname;

          const normalizedPath = process.platform === "win32" && dbPath.startsWith("/")
            ? dbPath.slice(1)
            : dbPath;

          const dir = path.dirname(normalizedPath);

          fs.mkdirSync(dir, { recursive: true });

          if (!fs.existsSync(normalizedPath)) {
            fs.writeFileSync(normalizedPath, "");
            logger.log(`Created new SQLite DB at ${normalizedPath}`);
          }
        }

        const client = createClient({
          url: env.DATABASE_URL,
        });

        const db = drizzle(client, { schema }) as LibSQLDatabase<typeof schema>;

        try {
          logger.log(path.join(__dirname, "migrations"));
          await migrate(db, {
            migrationsFolder: path.join(__dirname, "..", "..", "migrations")
          });
          logger.log("Database migrated successfully");
        } catch (error) {
          logger.log("Database migration failed", error);
        }

        return db;
      }
    }
  ],
  exports: [DRIZZLE]
})
export class DrizzleModule { }
