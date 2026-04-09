CREATE TABLE `meals_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text(36),
	`name` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`is_diet` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text(36),
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_table_token_unique` ON `sessions_table` (`token`);--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);