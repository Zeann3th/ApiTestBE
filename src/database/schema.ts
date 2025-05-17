import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const endpoints = sqliteTable("endpoints", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
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
  uniqueIndex("project_endpoints_path_idx").on(table.method, table.url)
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
  name: text("name").primaryKey(),
  value: text("value").notNull(),
  createdAt: text("created_at").$default(() => new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").$default(() => new Date().toISOString()).notNull(),
});

