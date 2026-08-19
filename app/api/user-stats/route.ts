import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, leaderboardPlayerKey } from "../../lib/auth/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in to view user stats." }, { status: 401 });
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");

    const playerKey = await leaderboardPlayerKey(user.id);
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql.query(`SELECT mode, config_key, config_label, score, accuracy, elapsed, updated_at
      FROM leaderboard_scores
      WHERE player_key = $1
      ORDER BY mode ASC, config_label ASC`, [playerKey]);

    return NextResponse.json({ username: user.username, bests: rows.map((row) => ({
      mode: row.mode,
      configKey: row.config_key,
      configLabel: row.config_label,
      score: row.score,
      accuracy: row.accuracy,
      elapsed: row.elapsed,
      updatedAt: row.updated_at,
    })) });
  } catch (error) {
    console.error("Unable to read user stats", error);
    return NextResponse.json({ error: "User stats are unavailable." }, { status: 503 });
  }
}
