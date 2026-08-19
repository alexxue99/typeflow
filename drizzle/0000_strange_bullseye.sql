CREATE TABLE "leaderboard_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_key" text NOT NULL,
	"username" text NOT NULL,
	"mode" text NOT NULL,
	"config_key" text NOT NULL,
	"config_label" text NOT NULL,
	"score" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"elapsed" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_player_config_idx" ON "leaderboard_scores" USING btree ("player_key","mode","config_key");--> statement-breakpoint
CREATE INDEX "leaderboard_rank_idx" ON "leaderboard_scores" USING btree ("mode","config_key","score","accuracy","elapsed");
