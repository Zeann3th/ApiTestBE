import { Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";

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
          await migrate(db, { migrationsFolder: "migrations" });
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
