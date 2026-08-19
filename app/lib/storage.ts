import { DEFAULT_SETTINGS, EMPTY_ANALYTICS } from "./defaults";
import type { AnalyticsData, Settings } from "./types";

const SETTINGS_KEY = "tactile-settings-v1";
const ANALYTICS_KEY = "tactile-analytics-v1";

export function loadSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Record<string, unknown>;
    delete stored.checkBetweenWords;
    return { ...DEFAULT_SETTINGS, ...stored } as Settings;
  }
  catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(settings: Settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export function loadAnalytics(): AnalyticsData {
  try { return { ...EMPTY_ANALYTICS, ...JSON.parse(localStorage.getItem(ANALYTICS_KEY) ?? "{}") }; }
  catch { return EMPTY_ANALYTICS; }
}
export function saveAnalytics(data: AnalyticsData) { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); }
