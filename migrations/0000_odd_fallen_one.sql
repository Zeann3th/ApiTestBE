CREATE TABLE `endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`method` text NOT NULL,
	`url` text NOT NULL,
	`headers` text,
	`body` text,
	`parameters` text,
	`project_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `endpoints_name_idx` ON `endpoints` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `endpoints_path_idx` ON `endpoints` (`project_id`,`method`,`url`);--> statement-breakpoint
CREATE TABLE `flow_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`endpoint_id` text NOT NULL,
	`status_code` integer,
	`response_time` real,
	`error` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `flow_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`endpoint_id`) REFERENCES `endpoints`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `flow_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`flow_id` text NOT NULL,
	`status` text NOT NULL,
	`ccu` integer NOT NULL,
	`threads` integer NOT NULL,
	`duration` integer NOT NULL,
	`ramp_up_time` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`flow_id`) REFERENCES `flows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `flow_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`flow_id` text NOT NULL,
	`endpoint_id` text NOT NULL,
	`post_processor` text,
	`sequence` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`flow_id`) REFERENCES `flows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`endpoint_id`) REFERENCES `endpoints`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `flow_steps_sequence_idx` ON `flow_steps` (`flow_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `flows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_idx` ON `projects` (`name`);