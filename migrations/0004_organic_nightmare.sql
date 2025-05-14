ALTER TABLE `endpoints` RENAME COLUMN "query" TO "parameters";--> statement-breakpoint
CREATE UNIQUE INDEX `project_endpoints_path_idx` ON `endpoints` (`method`,`url`);