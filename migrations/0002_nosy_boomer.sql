DROP INDEX `endpoints_path_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `endpoints_path_idx` ON `endpoints` (`name`,`method`,`url`);