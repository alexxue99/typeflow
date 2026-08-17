import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leaderboardScores = sqliteTable("leaderboard_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerKey: text("player_key").notNull(),
  initials: text("initials"),
  mode: text("mode").notNull(),
  configKey: text("config_key").notNull(),
  configLabel: text("config_label").notNull(),
  score: integer("score").notNull(),
  accuracy: integer("accuracy").notNull(),
  elapsed: integer("elapsed").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("leaderboard_player_config_idx").on(table.playerKey, table.mode, table.configKey),
  index("leaderboard_rank_idx").on(table.mode, table.configKey, table.score, table.accuracy, table.elapsed),
]);
