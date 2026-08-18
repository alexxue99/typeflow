import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { isLeaderboardMode } from "../../lib/leaderboard";
import { getNeonAuth, isNeonAuthConfigured } from "../../lib/auth/server";

type ScoreRow = {
  player_key: string;
  initials: string | null;
  score: number;
  accuracy: number;
  elapsed: number;
};
type Database = NeonQueryFunction<false, false>;

let sql: Database | null = null;
let schemaReady: Promise<void> | null = null;

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  sql ??= neon(connectionString);
  return sql;
}

function ensureSchema(db: Database) {
  if (!schemaReady) {
    schemaReady = db.transaction([
      db.query(`CREATE TABLE IF NOT EXISTS leaderboard_scores (
        id BIGSERIAL PRIMARY KEY,
        player_key TEXT NOT NULL,
        initials TEXT,
        mode TEXT NOT NULL,
        config_key TEXT NOT NULL,
        config_label TEXT NOT NULL,
        score INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        elapsed INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )`),
      db.query("CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_player_config_idx ON leaderboard_scores (player_key, mode, config_key)"),
      db.query("CREATE INDEX IF NOT EXISTS leaderboard_rank_idx ON leaderboard_scores (mode, config_key, score DESC, accuracy DESC, elapsed ASC)"),
    ]).then(() => undefined).catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function validConfigKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 2 || value.length > 3000) return false;
  try { return typeof JSON.parse(value) === "object"; } catch { return false; }
}

function validScore(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

async function playerKey(request: Request, required: boolean) {
  const neonSession = isNeonAuthConfigured() ? (await getNeonAuth().getSession()).data : null;
  const neonUserId = neonSession?.user?.id;
  const authenticatedEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const anonymousId = request.headers.get("x-typeflow-player-id")?.trim();
  const identity = neonUserId ? `neon:${neonUserId}` : authenticatedEmail ? `account:${authenticatedEmail}` : anonymousId && /^[a-zA-Z0-9-]{16,128}$/.test(anonymousId) ? `browser:${anonymousId}` : null;
  if (!identity) {
    if (required) throw new Error("A player identity is required.");
    return null;
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function betterThan(candidate: Pick<ScoreRow, "score" | "accuracy" | "elapsed">, existing: Pick<ScoreRow, "score" | "accuracy" | "elapsed">) {
  return candidate.score > existing.score
    || (candidate.score === existing.score && candidate.accuracy > existing.accuracy)
    || (candidate.score === existing.score && candidate.accuracy === existing.accuracy && candidate.elapsed < existing.elapsed);
}

async function readBoard(db: Database, mode: string, configKey: string, currentPlayer: string | null) {
  const result = await db.query(`SELECT player_key, initials, score, accuracy, elapsed
    FROM leaderboard_scores
    WHERE mode = $1 AND config_key = $2 AND initials IS NOT NULL
    ORDER BY score DESC, accuracy DESC, elapsed ASC, updated_at ASC
    LIMIT 10`, [mode, configKey]) as ScoreRow[];
  return result.map((row, index) => ({
    rank: index + 1,
    initials: row.initials,
    score: row.score,
    accuracy: row.accuracy,
    elapsed: row.elapsed,
    isYou: row.player_key === currentPlayer,
  }));
}

export async function GET(request: Request) {
  try {
    const db = database();
    await ensureSchema(db);
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "";
    const configKey = url.searchParams.get("config") ?? "";
    if (!isLeaderboardMode(mode) || !validConfigKey(configKey)) return NextResponse.json({ error: "Invalid leaderboard." }, { status: 400 });
    const currentPlayer = await playerKey(request, false);
    const board = await readBoard(db, mode, configKey, currentPlayer);
    const personalRows = currentPlayer
      ? await db.query("SELECT score, accuracy, elapsed FROM leaderboard_scores WHERE player_key = $1 AND mode = $2 AND config_key = $3", [currentPlayer, mode, configKey]) as Pick<ScoreRow, "score" | "accuracy" | "elapsed">[]
      : [];
    return NextResponse.json({ board, personal: personalRows[0] ?? null });
  } catch (error) {
    console.error("Unable to read leaderboard", error);
    return NextResponse.json({ error: "Leaderboard unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const db = database();
    await ensureSchema(db);
    const currentPlayer = await playerKey(request, true);
    const body = await request.json() as Record<string, unknown>;
    const { mode, configKey, configLabel, score, accuracy, elapsed } = body;
    const submittedInitials = typeof body.initials === "string" ? body.initials.trim().toUpperCase() : "";
    if (!isLeaderboardMode(String(mode)) || !validConfigKey(configKey) || typeof configLabel !== "string" || configLabel.length < 1 || configLabel.length > 500
      || !validScore(score, -100000, 100000) || !validScore(accuracy, 0, 100) || !validScore(elapsed, 0, 86400)
      || (submittedInitials && !/^[A-Z]{1,3}$/.test(submittedInitials))) {
      return NextResponse.json({ error: "Invalid score." }, { status: 400 });
    }

    const currentRows = await db.query("SELECT player_key, initials, score, accuracy, elapsed FROM leaderboard_scores WHERE player_key = $1 AND mode = $2 AND config_key = $3", [currentPlayer, mode, configKey]) as ScoreRow[];
    const current = currentRows[0];
    const candidate = { score, accuracy, elapsed };
    const improved = !current || betterThan(candidate, current);
    const now = new Date().toISOString();
    if (improved) {
      await db.query(`INSERT INTO leaderboard_scores (player_key, initials, mode, config_key, config_label, score, accuracy, elapsed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        ON CONFLICT(player_key, mode, config_key) DO UPDATE SET
          initials = COALESCE(EXCLUDED.initials, leaderboard_scores.initials), config_label = EXCLUDED.config_label,
          score = EXCLUDED.score, accuracy = EXCLUDED.accuracy, elapsed = EXCLUDED.elapsed, updated_at = EXCLUDED.updated_at`,
      [currentPlayer, submittedInitials || null, mode, configKey, configLabel, score, accuracy, elapsed, now]);
    }

    const personal = improved ? candidate : current!;
    const competitors = await db.query(`SELECT player_key, initials, score, accuracy, elapsed
      FROM leaderboard_scores WHERE mode = $1 AND config_key = $2 AND initials IS NOT NULL AND player_key <> $3
      ORDER BY score DESC, accuracy DESC, elapsed ASC, updated_at ASC LIMIT 10`, [mode, configKey, currentPlayer]) as ScoreRow[];
    const qualifies = competitors.length < 10 || betterThan(personal, competitors[9]);

    if (submittedInitials && qualifies && (!current || improved || current.score === score && current.accuracy === accuracy && current.elapsed === elapsed)) {
      await db.query("UPDATE leaderboard_scores SET initials = $1, updated_at = $2 WHERE player_key = $3 AND mode = $4 AND config_key = $5", [submittedInitials, now, currentPlayer, mode, configKey]);
    }

    return NextResponse.json({
      improved,
      qualifies: improved && qualifies && !submittedInitials,
      board: await readBoard(db, String(mode), configKey, currentPlayer),
      personal: { score: personal.score, accuracy: personal.accuracy, elapsed: personal.elapsed },
    });
  } catch (error) {
    console.error("Unable to record leaderboard score", error);
    return NextResponse.json({ error: "Score could not be recorded." }, { status: 503 });
  }
}
