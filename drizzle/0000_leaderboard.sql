CREATE TABLE `leaderboard_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_key` text NOT NULL,
	`initials` text,
	`mode` text NOT NULL,
	`config_key` text NOT NULL,
	`config_label` text NOT NULL,
	`score` integer NOT NULL,
	`accuracy` integer NOT NULL,
	`elapsed` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leaderboard_player_config_idx` ON `leaderboard_scores` (`player_key`,`mode`,`config_key`);
--> statement-breakpoint
CREATE INDEX `leaderboard_rank_idx` ON `leaderboard_scores` (`mode`,`config_key`,`score`,`accuracy`,`elapsed`);
