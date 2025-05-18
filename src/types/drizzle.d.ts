import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";

export type DrizzleDB = LibSQLDatabase<typeof schema>;
