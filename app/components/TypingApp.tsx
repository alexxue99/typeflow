/* eslint-disable react-hooks/set-state-in-effect -- Browser storage is loaded after hydration to keep server and client output aligned. */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SETTINGS, EMPTY_ANALYTICS } from "../lib/defaults";
import { loadAnalytics, loadSettings, saveAnalytics, saveSettings } from "../lib/storage";
import type { AnalyticsData, Page, Settings, TypingMode } from "../lib/types";
import { AnalyticsPage } from "./typing/AnalyticsPage";
import { HelpPage } from "./typing/HelpPage";
import { HomePage } from "./typing/HomePage";
import { SettingsPage } from "./typing/SettingsPage";
import { TypePage } from "./typing/TypePage";
import { UserStatsPage } from "./typing/UserStatsPage";
import { SignInForm, SignUpForm } from "./auth/AuthForms";

const PAGES = ["home", "type", "stats", "analytics", "settings", "help"] as const;
const PAGE_LABELS: Record<(typeof PAGES)[number], string> = { home: "Home", type: "Type", stats: "User stats", analytics: "Analytics", settings: "Settings", help: "Help" };

export default function TypingApp({ authAvailable = false, username = null }: { authAvailable?: boolean; username?: string | null }) {
  const router = useRouter();
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

  const finishAuth = () => {
    setPage("home");
    router.refresh();
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
              {PAGE_LABELS[item]}
            </button>
          ))}
          {authAvailable && (username
            ? <a className="auth-nav" href="/auth/sign-out" title={`Signed in as ${username}`}>Sign out</a>
            : <button className={page === "sign-in" || page === "sign-up" ? "auth-nav active" : "auth-nav"} onClick={() => setPage("sign-in")}>Sign in</button>)}
        </nav>
      </header>
      <main>
        {page === "home" && <HomePage onStart={start} />}
        {page === "type" && <TypePage mode={mode} setMode={setMode} settings={settings} setSettings={setSettings} analytics={analytics} setAnalytics={setAnalytics} username={username} authAvailable={authAvailable} onSignIn={() => setPage("sign-in")} />}
        {page === "stats" && <UserStatsPage username={username} authAvailable={authAvailable} onSignIn={() => setPage("sign-in")} />}
        {page === "analytics" && <AnalyticsPage data={analytics} setData={setAnalytics} />}
        {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
        {page === "help" && <HelpPage />}
        {page === "sign-in" && <section className="auth-page in-app-auth-page"><SignInForm onHome={() => setPage("home")} onSwitch={() => setPage("sign-up")} onSuccess={finishAuth} /></section>}
        {page === "sign-up" && <section className="auth-page in-app-auth-page"><SignUpForm onHome={() => setPage("home")} onSwitch={() => setPage("sign-in")} onSuccess={finishAuth} /></section>}
      </main>
      <footer><span></span><span>Version 0.2.7</span></footer>
    </div>
  );
}
