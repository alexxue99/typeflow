import { useEffect, useRef, useState } from "react";
import { createTargets, fingerForPosition, keyboardRows, replaceTarget } from "../../lib/keyboardshot";
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
  const [cursorShownByMouse, setCursorShownByMouse] = useState(false);
  const [traces, setTraces] = useState<Array<{ id: number; x1: number; y1: number; x2: number; y2: number }>>([]);
  const startedAt = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const previousKeyRef = useRef<string | null>(null);
  const traceIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const accuracy = Math.round(hits / Math.max(1, attempts) * 100);
  const remaining = Math.max(0, settings.duration - elapsed);

  const restart = () => {
    setTargets(createTargets(settings.keyboardshotTargetCount, Math.random, settings.useStandardLetterFrequency)); setStatus("idle"); setHits(0); setAttempts(0);
    setStreak(0); setBestStreak(0); setElapsed(0); setFeedback(""); setTraces([]); startedAt.current = 0; previousKeyRef.current = null;
    panelRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => { panelRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => () => { void audioContextRef.current?.close(); }, []);

  useEffect(() => {
    if (!settings.keyboardshotHitSounds) return;
    const context = audioContextRef.current ?? createKeyboardshotAudioContext();
    audioContextRef.current = context;
    if (context?.state === "suspended") void context.resume();
  }, [settings.keyboardshotHitSounds]);

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
    setCursorShownByMouse(false);
    if (status === "idle") { setStatus("active"); startedAt.current = performance.now(); }
    const key = event.key.toLowerCase();
    if (settings.keyboardshotTrace) {
      const keyboard = keyboardRef.current;
      const previousElement = previousKeyRef.current ? keyboard?.querySelector<HTMLElement>(`[data-key="${previousKeyRef.current}"]`) : null;
      const currentElement = keyboard?.querySelector<HTMLElement>(`[data-key="${key}"]`);
      if (keyboard && previousElement && currentElement) {
        const bounds = keyboard.getBoundingClientRect();
        const previousBounds = previousElement.getBoundingClientRect();
        const currentBounds = currentElement.getBoundingClientRect();
        const trace = { id: ++traceIdRef.current, x1: previousBounds.left + previousBounds.width / 2 - bounds.left, y1: previousBounds.top + previousBounds.height / 2 - bounds.top, x2: currentBounds.left + currentBounds.width / 2 - bounds.left, y2: currentBounds.top + currentBounds.height / 2 - bounds.top };
        setTraces((current) => [...current, trace]);
        window.setTimeout(() => setTraces((current) => current.filter((item) => item.id !== trace.id)), 700);
      }
      previousKeyRef.current = key;
    } else previousKeyRef.current = null;
    const hit = targets.includes(key);
    if (settings.keyboardshotHitSounds) {
      const context = audioContextRef.current ?? createKeyboardshotAudioContext();
      audioContextRef.current = context;
      if (context) void playKeyboardshotSound(context, hit);
    }
    setAttempts((value) => value + 1);
    setFeedback(hit ? "hit" : "miss");
    if (hit) {
      setHits((value) => { const next = value + 1; if (settings.sessionType === "words" && next >= settings.wordCount) setStatus("done"); return next; });
      setStreak((value) => { const next = value + 1; setBestStreak((best) => Math.max(best, next)); return next; });
      setTargets((current) => replaceTarget(current, key, Math.random, settings.useStandardLetterFrequency));
    } else setStreak(0);
  };

  return <section className="type-page" data-hide-cursor={settings.hideCursorDuringTests && status === "active" && !cursorShownByMouse ? "true" : "false"} onMouseMove={() => {
    if (status === "active") setCursorShownByMouse(true);
  }}>
    <div className="mode-tabs">{MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={item.id === "keyboardshot" ? "active" : ""}>{item.title}</button>)}</div>
    <div className="session-head"><div><span className="eyebrow">Keyboardshot session</span><h1>{status === "done" ? "Session complete." : MODES.find((m) => m.id === "keyboardshot")?.header}</h1></div><div className="session-actions"><button className="icon-button" onClick={restart} aria-label="Restart session">↻</button></div></div>
    <ModeSettings mode="keyboardshot" settings={settings} setSettings={setSettings} onRestart={restart} />
    <div className="stats-strip"><Metric label="Hits - misses" value={`${2 * hits - attempts}`} /><Metric label="Accuracy" value={`${accuracy}%`} /><Metric label={settings.sessionType === "timed" ? "Remaining" : "Elapsed"} value={`${settings.sessionType === "timed" ? remaining : elapsed}s`} /><Metric label="Streak" value={streak} /><Metric label="Best streak" value={bestStreak} /></div>
    <div ref={panelRef} className="typing-panel keyboardshot-panel" data-glow-fade={settings.keyboardshotGlowFade ? "on" : "off"} tabIndex={0} onKeyDown={onKeyDown} onClick={() => panelRef.current?.focus()} aria-label="Keyboardshot game">
     {/* <p className="keyboardshot-instructions"> {status === "idle" ? "Press any highlighted key to start. Each hit immediately reveals a new target." : ""}</p> */}
      <div className="keyboard" data-layout={settings.keyboardshotLayout} ref={keyboardRef} aria-live="polite">
        {settings.keyboardshotTrace && <svg className="keyboard-traces" aria-hidden="true">{traces.map(({ id, ...coordinates }) => <line key={id} {...coordinates} />)}</svg>}
        {keyboardRows(settings.keyboardshotLayout).map((row, rowIndex) => <div className="keyboard-row" key={rowIndex}>{row.map((key, columnIndex) => {
          const target = targets.includes(key);
          const finger = fingerForPosition(rowIndex, columnIndex);
          return <span data-key={key} data-finger={target && settings.keyboardshotFingerColors ? finger : undefined} aria-label={key} className={`keyboard-key${target ? " target" : ""}`} key={key}>{settings.keyboardshotShowLetters ? key : ""}</span>;
        })}</div>)}
      </div>
      <div className={`keyboardshot-status ${feedback}`}>{status === "idle" ? "Press any highlighted key to start" : status === "done" ? `${hits} hits · ${accuracy}% accuracy` : feedback === "hit" ? "Hit!" : feedback === "miss" ? "Miss — find a highlighted key" : ""}</div>
    </div>
    {status === "done" && <div className="result-card"><div><span className="eyebrow">Nice reflexes</span><h2>{hits} hits · {accuracy}% accuracy</h2></div><button className="primary" onClick={restart}>Play again</button></div>}
  </section>;
}
