import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const leaderboardScores = pgTable("leaderboard_scores", {
  id: serial("id").primaryKey(),
  playerKey: text("player_key").notNull(),
  initials: text("initials"),
  mode: text("mode").notNull(),
  configKey: text("config_key").notNull(),
  configLabel: text("config_label").notNull(),
  score: integer("score").notNull(),
  accuracy: integer("accuracy").notNull(),
  elapsed: integer("elapsed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex("leaderboard_player_config_idx").on(table.playerKey, table.mode, table.configKey),
  index("leaderboard_rank_idx").on(table.mode, table.configKey, table.score, table.accuracy, table.elapsed),
]);
