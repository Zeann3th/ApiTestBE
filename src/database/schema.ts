import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users_29d9a827", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  username: text().unique().notNull(),
  email: text().unique().notNull(),
  password: text().notNull(),
  refreshToken: text("refresh_token"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const projectMembers = sqliteTable("project_members", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  role: text("role", { enum: ["OWNER", "EDITOR"] }).notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const endpoints = sqliteTable("endpoints", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  method: text("method", { enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] }).notNull(),
  url: text("url").notNull(),
  headers: text("headers", { mode: "json" }),
  body: text("body", { mode: "json" }),
  parameters: text("parameters", { mode: "json" }),
  preProcessors: text("pre_processors", { mode: "json" }),
  postProcessors: text("post_processors", { mode: "json" }),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("project_endpoints_idx").on(table.projectId),
  uniqueIndex("project_endpoints_path_idx").on(table.method, table.url)
]);

export const flows = sqliteTable("flows", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  index("project_flows_idx").on(table.projectId),
]);

export const flowSteps = sqliteTable("flow_steps", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  flowId: text("flow_id").references(() => flows.id).notNull(),
  endpointId: text("endpoint_id").references(() => endpoints.id).notNull(),
  order: integer("order").notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const flowRuns = sqliteTable("flow_runs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  flowId: text("flow_id").references(() => flows.id).notNull(),
  status: text("status", { enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"] }).$default(() => "PENDING").notNull(),
  latency: real("latency"),
  successRate: real("success_rate").$default(() => 0).notNull(),
  throughput: real("throughput"),
  ccu: integer("ccu"),
  threads: integer("threads"),
  startedAt: text("started_at").$default(() => new Date().toISOString()).notNull(),
  completedAt: text("completed_at"),
  note: text("note"),
});

export const variables = sqliteTable("variables", {
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.name], name: "project_variables_pk" }),
]);

