import { Logger, Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common/env";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import * as keytar from "keytar";
import * as crypto from "crypto";

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

        let encryptionKey = await keytar.getPassword(env.APP_NAME, "default");
        if (!encryptionKey) {
          encryptionKey = crypto.randomBytes(64).toString("hex");
          await keytar.setPassword(env.APP_NAME, "default", encryptionKey);
        }

        const client = createClient({
          url: env.DATABASE_URL,
          encryptionKey
        });

        const db = drizzle(client, { schema }) as LibSQLDatabase<typeof schema>;

        try {
          await migrate(db, {
            migrationsFolder: path.join(__dirname, "..", "..", "migrations")
          });
          await db.run("PRAGMA journal_mode=WAL");
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
