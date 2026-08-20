import { DEFAULT_SETTINGS, EMPTY_ANALYTICS } from "./defaults";
import type { AnalyticsData, Settings } from "./types";

const SETTINGS_KEY = "tactile-settings-v1";
const ANALYTICS_KEY = "tactile-analytics-v1";

export function loadSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Record<string, unknown>;
    return { ...DEFAULT_SETTINGS, ...stored } as Settings;
  }
  catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(settings: Settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export function loadAnalytics(): AnalyticsData {
  try {
    const stored = JSON.parse(localStorage.getItem(ANALYTICS_KEY) ?? "{}") as Partial<Omit<AnalyticsData, "sessions">> & {
      sessions?: Array<Partial<AnalyticsData["sessions"][number]> & { wpm?: number }>;
    };
    const sessions = (stored.sessions ?? []).map(({ wpm, ...session }) => ({
      ...session,
      wpm_scaled: typeof session.wpm_scaled === "number" ? session.wpm_scaled : Math.round((wpm ?? 0) * 100),
    })) as AnalyticsData["sessions"];
    return { ...EMPTY_ANALYTICS, ...stored, sessions };
  }
  catch { return EMPTY_ANALYTICS; }
}
export function saveAnalytics(data: AnalyticsData) { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); }
