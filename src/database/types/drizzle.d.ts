import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../schema";

export type DrizzleDB = LibSQLDatabase<typeof schema>;
