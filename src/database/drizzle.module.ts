import { Logger, Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as path from "path";

export const DRIZZLE = Symbol("Drizzle Connection");

@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        const logger = new Logger("DatabaseMigrator")
        const client = createClient({
          url: env.DATABASE_URL,
        });

        const db = drizzle(client, { schema }) as LibSQLDatabase<typeof schema>;

        try {
          logger.log(__dirname);
          await migrate(db, { migrationsFolder: path.join(__dirname, "..", "..", "migrations") });
          logger.log("Database migrated successfully");
        } catch (error) {
          logger.log("Database tables already exist");
        }

        return db;
      }
    }
  ],
  exports: [DRIZZLE]
})
export class DrizzleModule { }
