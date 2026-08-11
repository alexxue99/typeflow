import { useEffect, useRef, useState } from "react";
import { createTargets, KEYBOARD_ROWS, replaceTarget } from "../../lib/keyboardshot";
import { createKeyboardshotAudioContext, playKeyboardshotSound } from "../../lib/keyboardshotSounds";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { ModeSettings } from "./ModeSettings";

type Props = { mode: TypingMode; setMode: (mode: TypingMode) => void; settings: Settings; setSettings: (settings: Settings) => void; analytics: AnalyticsData; setAnalytics: (data: AnalyticsData) => void };

export function KeyboardshotPage({ setMode, settings, setSettings }: Props) {
  const [targets, setTargets] = useState(() => createTargets(settings.keyboardshotTargetCount, Math.random, settings.useStandardLetterFrequency));
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | "">("");
  const startedAt = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const accuracy = Math.round(hits / Math.max(1, attempts) * 100);
  const remaining = Math.max(0, settings.duration - elapsed);

  const restart = () => {
    setTargets(createTargets(settings.keyboardshotTargetCount, Math.random, settings.useStandardLetterFrequency)); setStatus("idle"); setHits(0); setAttempts(0);
    setStreak(0); setBestStreak(0); setElapsed(0); setFeedback(""); startedAt.current = 0;
    panelRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => { panelRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => () => { void audioContextRef.current?.close(); }, []);

  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAt.current) / 1000);
      setElapsed(seconds);
      if (settings.sessionType === "timed" && seconds >= settings.duration) setStatus("done");
    }, 200);
    return () => window.clearInterval(timer);
  }, [status, settings.duration, settings.sessionType]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === settings.resetHotkey) { event.preventDefault(); restart(); return; }
    if (status === "done" || !/^[a-z]$/i.test(event.key)) return;
    event.preventDefault();
    if (status === "idle") { setStatus("active"); startedAt.current = performance.now(); }
    const key = event.key.toLowerCase();
    const hit = targets.includes(key);
    if (settings.keyboardshotHitSounds) {
      const context = audioContextRef.current ?? createKeyboardshotAudioContext();
      audioContextRef.current = context;
      if (context) {
        if (context.state === "suspended") void context.resume();
        playKeyboardshotSound(context, hit);
      }
    }
    setAttempts((value) => value + 1);
    setFeedback(hit ? "hit" : "miss");
    if (hit) {
      setHits((value) => { const next = value + 1; if (settings.sessionType === "words" && next >= settings.wordCount) setStatus("done"); return next; });
      setStreak((value) => { const next = value + 1; setBestStreak((best) => Math.max(best, next)); return next; });
      setTargets((current) => replaceTarget(current, key, Math.random, settings.useStandardLetterFrequency));
    } else setStreak(0);
  };

  return <section className="type-page">
    <div className="mode-tabs">{MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={item.id === "keyboardshot" ? "active" : ""}>{item.title}</button>)}</div>
    <div className="session-head"><div><span className="eyebrow">Keyboardshot session</span><h1>{status === "done" ? "Session complete." : MODES.find((m) => m.id === "keyboardshot")?.header}</h1></div><div className="session-actions"><button className="icon-button" onClick={restart} aria-label="Restart session">↻</button></div></div>
    <ModeSettings mode="keyboardshot" settings={settings} setSettings={setSettings} onRestart={restart} />
    <div className="stats-strip"><Metric label="Hits - misses" value={`${2 * hits - attempts}`} /><Metric label="Accuracy" value={`${accuracy}%`} /><Metric label={settings.sessionType === "timed" ? "Remaining" : "Elapsed"} value={`${settings.sessionType === "timed" ? remaining : elapsed}s`} /><Metric label="Streak" value={streak} /><Metric label="Best streak" value={bestStreak} /></div>
    <div ref={panelRef} className="typing-panel keyboardshot-panel" data-glow-fade={settings.keyboardshotGlowFade ? "on" : "off"} tabIndex={0} onKeyDown={onKeyDown} onClick={() => panelRef.current?.focus()} aria-label="Keyboardshot game">
     {/* <p className="keyboardshot-instructions"> {status === "idle" ? "Press any highlighted key to start. Each hit immediately reveals a new target." : ""}</p> */}
      <div className="keyboard" aria-live="polite">{KEYBOARD_ROWS.map((row, index) => <div className="keyboard-row" key={index}>{row.map((key) => <span className={`keyboard-key${targets.includes(key) ? " target" : ""}`} key={key}>{key}</span>)}</div>)}</div>
      <div className={`keyboardshot-status ${feedback}`}>{status === "idle" ? "Press any highlighted key to start" : status === "done" ? `${hits} hits · ${accuracy}% accuracy` : feedback === "hit" ? "Hit!" : feedback === "miss" ? "Miss — find a highlighted key" : ""}</div>
    </div>
    {status === "done" && <div className="result-card"><div><span className="eyebrow">Nice reflexes</span><h2>{hits} hits · {accuracy}% accuracy</h2></div><button className="primary" onClick={restart}>Play again</button></div>}
  </section>;
}
