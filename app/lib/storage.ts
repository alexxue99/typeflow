import { DEFAULT_SETTINGS, EMPTY_ANALYTICS } from "./defaults";
import type { AnalyticsData, Settings } from "./types";

const SETTINGS_KEY = "tactile-settings-v1";
const ANALYTICS_KEY = "tactile-analytics-v1";
const LEADERBOARD_PLAYER_KEY = "typeflow-leaderboard-player-v1";
const LEADERBOARD_INITIALS_KEY = "typeflow-leaderboard-initials-v1";

export function loadSettings(): Settings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") }; }
  catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(settings: Settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export function loadAnalytics(): AnalyticsData {
  try { return { ...EMPTY_ANALYTICS, ...JSON.parse(localStorage.getItem(ANALYTICS_KEY) ?? "{}") }; }
  catch { return EMPTY_ANALYTICS; }
}
export function saveAnalytics(data: AnalyticsData) { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); }

export function getLeaderboardPlayerId() {
  const existing = localStorage.getItem(LEADERBOARD_PLAYER_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(LEADERBOARD_PLAYER_KEY, id);
  return id;
}

export function loadLeaderboardInitials() { return localStorage.getItem(LEADERBOARD_INITIALS_KEY) ?? ""; }
export function saveLeaderboardInitials(initials: string) { localStorage.setItem(LEADERBOARD_INITIALS_KEY, initials); }
