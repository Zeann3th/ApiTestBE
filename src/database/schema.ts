import { index, integer, primaryKey, real, sqliteTable, sqliteView, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users_29d9a827", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  username: text().unique().notNull(),
  name: text().notNull().$default(() => "User_" + crypto.randomUUID().substring(0, 5)),
  email: text().unique().notNull(),
  isVerified: integer("is_verified").$default(() => 0).notNull(),
  password: text().notNull(),
  refreshToken: text("refresh_token"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const projects = sqliteTable("projects", {
});

