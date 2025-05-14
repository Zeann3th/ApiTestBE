CREATE TABLE `variables` (
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`project_id`, `name`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users_29d9a827` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users_29d9a827` DROP COLUMN `is_verified`;