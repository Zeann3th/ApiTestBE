CREATE TABLE `flow_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`flow_id` text NOT NULL,
	`status` text NOT NULL,
	`latency` real,
	`success_rate` real NOT NULL,
	`throughput` real,
	`ccu` integer,
	`threads` integer,
	`started_at` text NOT NULL,
	`completed_at` text,
	`note` text,
	FOREIGN KEY (`flow_id`) REFERENCES `flows`(`id`) ON UPDATE no action ON DELETE no action
);
