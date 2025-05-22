import { index, integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const endpoints = sqliteTable("endpoints", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  method: text("method", { enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] }).notNull(),
  url: text("url").notNull(),
  headers: text("headers", { mode: "json" }),
  body: text("body", { mode: "json" }),
  parameters: text("parameters", { mode: "json" }),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  unique("endpoints_path_idx").on(table.method, table.url),
  index("endpoints_name_idx").on(table.name)
]);

export const flows = sqliteTable("flows", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

export const flowSteps = sqliteTable("flow_steps", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  flowId: text("flow_id").references(() => flows.id, { onDelete: "cascade" }).notNull(),
  endpointId: text("endpoint_id").references(() => endpoints.id, { onDelete: "cascade" }).notNull(),
  postProcessor: text("post_processor", { mode: "json" }),
  sequence: integer("sequence").notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
}, (table) => [
  unique("flow_steps_sequence_idx").on(table.flowId, table.sequence),
]);

export const flowRuns = sqliteTable("flow_runs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  flowId: text("flow_id").references(() => flows.id, { onDelete: "cascade" }).notNull(),
  ccu: integer("ccu"),
  threads: integer("threads"),
  duration: integer("duration"),
});

export const flowLogs = sqliteTable("flow_logs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  runId: text("run_id").references(() => flowRuns.id, { onDelete: "cascade" }).notNull(),
  endpointId: text("endpoint_id").references(() => endpoints.id, { onDelete: "cascade" }).notNull(),
  statusCode: integer("status_code"),
  responseTime: real("response_time"),
  error: text("error"),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
});
