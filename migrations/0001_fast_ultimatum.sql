DROP INDEX "endpoints_name_idx";--> statement-breakpoint
DROP INDEX "endpoints_path_idx";--> statement-breakpoint
DROP INDEX "flow_steps_sequence_idx";--> statement-breakpoint
ALTER TABLE `flow_runs` ALTER COLUMN "ccu" TO "ccu" integer NOT NULL;--> statement-breakpoint
CREATE INDEX `endpoints_name_idx` ON `endpoints` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `endpoints_path_idx` ON `endpoints` (`method`,`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `flow_steps_sequence_idx` ON `flow_steps` (`flow_id`,`sequence`);--> statement-breakpoint
ALTER TABLE `flow_runs` ALTER COLUMN "threads" TO "threads" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `flow_runs` ALTER COLUMN "duration" TO "duration" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `flow_runs` ADD `ramp_up_time` integer NOT NULL;