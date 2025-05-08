import { createClient } from "@libsql/client";
import { Module } from "@nestjs/common";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import env from "src/common";
import * as schema from "./schema";

export const DRIZZLE = Symbol("Drizzle Connection");

@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        const url = env.DATABASE_URL;
        const authToken = env.DATABASE_AUTH_TOKEN;

        const turso = await createClient({
          url,
          authToken,
        })

        return drizzle(turso, { schema }) as LibSQLDatabase<typeof schema>;
      }
    }
  ],
  exports: [DRIZZLE]
})

export class DrizzleModule { }
