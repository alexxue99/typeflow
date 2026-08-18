/* eslint-disable react-hooks/set-state-in-effect -- Browser storage is loaded after hydration to keep server and client output aligned. */
"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, EMPTY_ANALYTICS } from "../lib/defaults";
import { loadAnalytics, loadSettings, saveAnalytics, saveSettings } from "../lib/storage";
import type { AnalyticsData, Page, Settings, TypingMode } from "../lib/types";
import { AnalyticsPage } from "./typing/AnalyticsPage";
import { HelpPage } from "./typing/HelpPage";
import { HomePage } from "./typing/HomePage";
import { SettingsPage } from "./typing/SettingsPage";
import { TypePage } from "./typing/TypePage";

const PAGES: Page[] = ["home", "type", "analytics", "settings", "help"];

export default function TypingApp({ authAvailable = false, userName = null }: { authAvailable?: boolean; userName?: string | null }) {
  const [page, setPage] = useState<Page>("home");
  const [mode, setMode] = useState<TypingMode>("flow");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setAnalytics(loadAnalytics());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSettings(settings);
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  }, [settings, ready]);

  useEffect(() => {
    if (ready) saveAnalytics(analytics);
  }, [analytics, ready]);

  const start = (nextMode: TypingMode) => {
    setMode(nextMode);
    setPage("type");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage("home")} aria-label="typeflow home">
          <span className="brand-mark">tf</span><span>typeflow</span>
        </button>
        <nav aria-label="Main navigation">
          {PAGES.map((item) => (
            <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>
              {item === "type" ? "Type" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
          {authAvailable && (userName
            ? <a className="auth-nav" href="/auth/sign-out" title={`Signed in as ${userName}`}>Sign out</a>
            : <a className="auth-nav" href="/auth/sign-in">Sign in</a>)}
        </nav>
      </header>
      <main>
        {page === "home" && <HomePage onStart={start} />}
        {page === "type" && <TypePage mode={mode} setMode={setMode} settings={settings} setSettings={setSettings} analytics={analytics} setAnalytics={setAnalytics} />}
        {page === "analytics" && <AnalyticsPage data={analytics} setData={setAnalytics} />}
        {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
        {page === "help" && <HelpPage />}
      </main>
      {/*<footer><span>Your data stays in this browser.</span><span>Built for steady progress, not pressure.</span></footer>*/}
    </div>
  );
}
