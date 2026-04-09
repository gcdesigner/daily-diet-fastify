PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meals_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text(36) NOT NULL,
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
INSERT INTO `__new_meals_table`("id", "user_id", "name", "description", "date", "time", "is_diet", "created_at", "updated_at") SELECT "id", "user_id", "name", "description", "date", "time", "is_diet", "created_at", "updated_at" FROM `meals_table`;--> statement-breakpoint
DROP TABLE `meals_table`;--> statement-breakpoint
ALTER TABLE `__new_meals_table` RENAME TO `meals_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sessions_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`user_id` text(36) NOT NULL,
	`token` text(64) NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions_table`("id", "user_id", "token", "created_at", "expires_at") SELECT "id", "user_id", "token", "created_at", "expires_at" FROM `sessions_table`;--> statement-breakpoint
DROP TABLE `sessions_table`;--> statement-breakpoint
ALTER TABLE `__new_sessions_table` RENAME TO `sessions_table`;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_table_token_unique` ON `sessions_table` (`token`);