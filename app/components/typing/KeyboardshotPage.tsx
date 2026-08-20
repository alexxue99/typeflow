import { useEffect, useRef, useState}  from "react";
import { createTargets, fingerForPosition, keyboardRows, replaceTarget } from "../../lib/keyboardshot";
import { createKeyboardshotAudioContext, playKeyboardshotSound } from "../../lib/keyboardshotSounds";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { ModeSettings } from "./ModeSettings";
import { Leaderboard } from "./Leaderboard";

type Props = { mode: TypingMode; setMode: (mode: TypingMode) => void; settings: Settings; setSettings: (settings: Settings) => void; analytics: AnalyticsData; setAnalytics: (data: AnalyticsData) => void; username: string | null; authAvailable: boolean; onSignIn: () => void };

export function KeyboardshotPage({ setMode, settings, setSettings, username, authAvailable, onSignIn }: Props) {
  const [targets, setTargets] = useState(() => createTargets(settings.keyboardshotTargetCount, Math.random, settings.useStandardLetterFrequency));
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
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
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
  const remaining = Math.max(0, settings.duration - elapsedSeconds);

  const restart = (nextSettings = settings) => {
    setTargets(createTargets(nextSettings.keyboardshotTargetCount, Math.random, nextSettings.useStandardLetterFrequency)); setStatus("idle"); setHits(0); setAttempts(0);
    setStreak(0); setBestStreak(0); setElapsedMilliseconds(0); setFeedback(""); setTraces([]); startedAt.current = 0; previousKeyRef.current = null;
    panelRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => { panelRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => () => {
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  useEffect(() => {
    if (!settings.keyboardshotHitSounds) return;
    const context = audioContextRef.current ?? createKeyboardshotAudioContext();
    audioContextRef.current = context;
    if (context?.state === "suspended") void context.resume();
  }, [settings.keyboardshotHitSounds]);

  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => {
      const milliseconds = Math.round(performance.now() - startedAt.current);
      if (settings.sessionType === "time" && milliseconds >= settings.duration * 1000) {
        setElapsedMilliseconds(settings.duration * 1000);
        setStatus("done");
      } else setElapsedMilliseconds(milliseconds);
    }, 50);
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
      const nextHits = hits + 1;
      setHits(nextHits);
      if (settings.sessionType === "words" && nextHits >= settings.wordCount) {
        setElapsedMilliseconds(Math.round(performance.now() - startedAt.current));
        setStatus("done");
      }
      setStreak((value) => { const next = value + 1; setBestStreak((best) => Math.max(best, next)); return next; });
      setTargets((current) => replaceTarget(current, key, Math.random, settings.useStandardLetterFrequency));
    } else setStreak(0);
  };

  return <section className="type-page" data-hide-cursor={settings.hideCursorDuringTests && status === "active" && !cursorShownByMouse ? "true" : "false"} onMouseMove={() => {
    if (status === "active") setCursorShownByMouse(true);
  }}>
    <div className="mode-tabs">{MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={item.id === "keyboardshot" ? "active" : ""}>{item.title}</button>)}</div>
    <div className="session-head"><div><span className="eyebrow">Keyboardshot session</span><h1>{status === "done" ? "Session complete." : MODES.find((m) => m.id === "keyboardshot")?.header}</h1></div><div className="session-actions"><button className="icon-button" onClick={() => restart()} aria-label="Restart session">↻</button></div></div>
    <ModeSettings mode="keyboardshot" settings={settings} setSettings={setSettings} onRestart={(nextSettings) => restart(nextSettings)} />
    <div className="stats-strip"><Metric label="Hits - misses" value={`${2 * hits - attempts}`} /><Metric label="Accuracy" value={`${accuracy}%`} /><Metric label={settings.sessionType === "time" ? "Remaining" : "Elapsed"} value={settings.sessionType === "time" ? `${remaining}s` : `${(elapsedMilliseconds / 1000).toFixed(3)}s`} /><Metric label="Streak" value={streak} /><Metric label="Best streak" value={bestStreak} /></div>
    <div ref={panelRef} className="typing-panel keyboardshot-panel" data-status={status} data-glow-fade={settings.keyboardshotGlowFade ? "on" : "off"} tabIndex={0} onKeyDown={onKeyDown} onClick={() => panelRef.current?.focus()} aria-label="Keyboardshot game">
     {/* <p className="keyboardshot-instructions"> {status === "idle" ? "Press any highlighted key to start. Each hit immediately reveals a new target." : ""}</p> */}
      <div className="keyboard" data-layout={settings.keyboardshotLayout} ref={keyboardRef} aria-live="polite">
        {settings.keyboardshotTrace && <svg className="keyboard-traces" aria-hidden="true">{traces.map(({ id, ...coordinates }) => <line key={id} {...coordinates} />)}</svg>}
        {keyboardRows(settings.keyboardshotLayout).map((row, rowIndex) => <div className="keyboard-row" key={rowIndex}>{row.map((key, columnIndex) => {
          const target = targets.includes(key);
          const finger = fingerForPosition(rowIndex, columnIndex);
          return <span data-key={key} data-finger={target && settings.keyboardshotFingerColors ? finger : undefined} aria-label={key} className={`keyboard-key${target ? " target" : ""}`} key={key}>{settings.keyboardshotShowLetters ? key : ""}</span>;
        })}</div>)}
      </div>
      <p className={status === "done" ? "typing-reset-prompt" : undefined}>{status === "idle" ? `Click anywhere here, then press any highlighted key to start. Press ${settings.resetHotkey} to reset.` : status === "done" ? `Test finished! Press ${settings.resetHotkey} to reset.` : feedback === "hit" ? "Hit!" : feedback === "miss" ? "Miss — find a highlighted key" : ""}</p>
    </div>
    {status === "done" && <div className="result-card"><div><span className="eyebrow">Nice reflexes</span><h2>{settings.sessionType === "words" ? (elapsedMilliseconds / 1000).toFixed(3) + "s" : 2 * hits - attempts + " points"} · {accuracy}% accuracy</h2></div><div className="session-actions"><button className="icon-button" onClick={() => restart()} aria-label="Restart session">↻</button></div></div>}
    <Leaderboard mode="keyboardshot" settings={settings} done={status === "done"} score={settings.sessionType === "words" ? elapsedMilliseconds : 2 * hits - attempts} accuracy={accuracy} elapsed={settings.sessionType === "words" ? elapsedMilliseconds : elapsedSeconds} username={username} authAvailable={authAvailable} onSignIn={onSignIn} />
  </section>;
}
