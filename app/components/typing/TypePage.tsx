/* eslint-disable react-hooks/refs -- The session hook intentionally exposes its input ref and event handlers to its page component. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { calculateResult, collectsAnalytics, recordKeystroke } from "../../lib/analytics";
import { calculateCadenceActiveElapsed, calculateCadenceCaretIndex } from "../../lib/cadence";
import { createCadenceAudioContext, playCadenceBlockSound } from "../../lib/cadenceSounds";
import { generateExercise, rankTrouble } from "../../lib/generators";
import { advanceToNextWord, backspaceTypedCharacters, isExtraWordCharacter } from "../../lib/typing";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { KeyboardshotPage } from "./KeyboardshotPage";
import { Leaderboard } from "./Leaderboard";
import { ModeSettings } from "./ModeSettings";

type TypePageProps = {
  mode: TypingMode;
  setMode: (mode: TypingMode) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  analytics: AnalyticsData;
  setAnalytics: (data: AnalyticsData) => void;
  username: string | null;
  authAvailable: boolean;
  onSignIn: () => void;
};

export function TypePage(props: TypePageProps) {
  useEffect(() => {
    const preventSpacebarScroll = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Spacebar" && event.code !== "Space") return;

      const target = event.target instanceof Element ? event.target : null;
      // Preserve the native Space behavior of controls in the test settings.
      if (target?.closest("button, input, select, textarea, summary, [contenteditable='true']")) return;

      event.preventDefault();
    };

    window.addEventListener("keydown", preventSpacebarScroll);
    return () => window.removeEventListener("keydown", preventSpacebarScroll);
  }, []);

  if (props.mode === "keyboardshot") return <KeyboardshotPage {...props} />;
  return <SequentialTypingPage {...props} />;
}

function SequentialTypingPage(props: TypePageProps) {
  const { mode, setMode, settings, setSettings, analytics } = props;
  const sequentialSession = useTypingSession(props);
  const session = sequentialSession;
  const practiceTargets = mode === "practice" ? rankTrouble(analytics) : [];
  const [cursorShownByMouse, setCursorShownByMouse] = useState(false);
  const hideCursor = settings.hideCursorDuringTests && session.status === "active" && !cursorShownByMouse;

  return (
    <section className="type-page" data-hide-cursor={hideCursor ? "true" : "false"} onMouseMove={() => {
      if (session.status === "active") setCursorShownByMouse(true);
    }}>
      <div className="mode-tabs">
        {MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={mode === item.id ? "active" : ""}>{item.title}</button>)}
      </div>
      <div className="session-head">
        <div><span className="eyebrow">{mode} session</span><h1>{session.status === "done" ? "Session complete." : MODES.find((m) => m.id === mode)?.header}</h1></div>
        <div className="session-actions"><button className="icon-button" onClick={() => session.restart()} aria-label="Restart session">↻</button></div>
      </div>
      <ModeSettings mode={mode} settings={settings} setSettings={setSettings} onRestart={(nextSettings) => session.restart(nextSettings)} />
      {sequentialSession.exercise.warning && <div className="notice">{sequentialSession.exercise.warning}</div>}
      {mode === "practice" && <div className="notice">{practiceTargets.length ? `This practice emphasizes "${practiceTargets.join(", ")}" based on your recent Flow performances.` : "Complete a few Flow sessions to unlock personalized exercises. This sample session is not added to your analytics."}</div>}
      <div className="stats-strip">
        <Metric label="WPM" value={Math.round(session.wpm_scaled / 100)} /><Metric label="Accuracy" value={`${session.accuracy}%`} />
        <Metric label={settings.sessionType === "time" ? "Remaining" : "Elapsed"} value={settings.sessionType === "time" ? `${session.remaining}s` : settings.sessionType === "words" ? `${(session.elapsedMilliseconds / 1000).toFixed(1)}s` : `${session.elapsed}s`} />
        <Metric label="Characters" value={session.characterCount} /><Metric label="Progress" value={settings.sessionType === "words" ? `${session.progress}%` : "—"} />
      </div>
      <div
        className="typing-panel"
        data-caret={settings.caretAppearance}
        data-caret-blink={settings.caretBlink ? "on" : "off"}
        onClick={session.focus}
        style={{ fontSize: settings.fontSize, "--caret-color": session.cadencePaused ? "var(--correct)" : settings.caretColor } as CSSProperties}
      >
        {mode === "cadence" && session.status === "idle" && <p className="cadence-idle-instruction">After you finish a block, the caret advances to the next block after a set delay.</p>}
        <TextStream text={sequentialSession.exercise.text} typed={sequentialSession.typed} caretIndex={sequentialSession.caretIndex} onNeedMore={settings.sessionType === "words" ? undefined : sequentialSession.appendExercise} />
        <input ref={sequentialSession.inputRef} className="typing-capture" onKeyDown={(event) => {
          if (event.key.length === 1 && event.key !== settings.resetHotkey && session.status !== "done") setCursorShownByMouse(false);
          sequentialSession.onKey(event);
        }} aria-label="Typing input" />
        {session.status === "done" ? (
          <p className="typing-reset-prompt">Test finished! Press {settings.resetHotkey} to reset.</p>
        ) : (
          <p>{session.status === "idle" ? "Click anywhere here, then start typing. " : ""}{mode === "cadence" ? "Blocks advance automatically. " : "Use Backspace to fix typos. "}Press {settings.resetHotkey} to reset.</p>
        )}
      </div>
      {session.status === "done" && <div className="result-card"><div><span className="eyebrow">Good job</span><h2>{`${session.wpm_scaled / 100} WPM`} · {session.accuracy}% accuracy</h2></div><div className="session-actions"><button className="icon-button" onClick={() => session.restart()} aria-label="Restart session">↻</button></div></div>}
      {(mode === "flow" || mode === "zen" || mode === "cadence") && <Leaderboard mode={mode} settings={settings} done={session.status === "done"} score={session.wpm_scaled} accuracy={session.accuracy} elapsed={settings.sessionType === "words" ? session.elapsedMilliseconds : session.elapsed} username={props.username} authAvailable={props.authAvailable} onSignIn={props.onSignIn} />}
    </section>
  );
}

function useTypingSession({ mode, settings, analytics, setAnalytics }: Omit<TypePageProps, "setMode" | "setSettings" | "username" | "authAvailable" | "onSignIn">) {
  const isCadence = mode === "cadence";
  const createExercise = (nextSettings = settings) => generateExercise(mode, nextSettings.mapping, nextSettings.minimumGap, nextSettings.wordCount, nextSettings.zenBlockSize, nextSettings.workoutFinger, nextSettings.workoutRepeats, analytics, nextSettings.useStandardLetterFrequency);
  const [exercise, setExercise] = useState(createExercise);
  const [typed, setTyped] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [cadencePaused, setCadencePaused] = useState(false);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const startedAt = useRef(0);
  const cadenceActiveStartedAt = useRef<number | null>(null);
  const cadenceActiveMilliseconds = useRef(0);
  const cadencePauseTimer = useRef<number | null>(null);
  const cadenceAudioContext = useRef<AudioContext | null>(null);
  const lastKeyAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const attempts = isCadence ? typed.filter((char) => char !== " ").length : typed.length;
  const correct = typed.filter((char, index) => char === exercise.text[index] && (!isCadence || char !== " ")).length;
  const accuracy = Math.round(correct / Math.max(1, attempts) * 100);
  const elapsed = Math.floor(elapsedMilliseconds / 1000);
  const wpm_scaled = Math.round(((correct / 5) / Math.max(elapsedMilliseconds / 60000, 1 / 60)) * 100);
  const remaining = Math.max(0, settings.duration - elapsed);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });
  const activeElapsedAt = (now: number) => calculateCadenceActiveElapsed(cadenceActiveMilliseconds.current, cadenceActiveStartedAt.current, now);
  const appendExercise = useCallback(() => {
    const more = createExercise();
    setExercise((current) => ({ ...current, text: `${current.text} ${more.text}` }));
  // The generator intentionally uses the latest session settings when the viewport needs refilling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings, analytics]);
  const restart = (nextSettings = settings) => {
    if (cadencePauseTimer.current !== null) window.clearTimeout(cadencePauseTimer.current);
    setExercise(createExercise(nextSettings));
    setTyped([]);
    setElapsedMilliseconds(0);
    setStatus("idle");
    setCadencePaused(false);
    startedAt.current = 0;
    cadenceActiveStartedAt.current = null;
    cadenceActiveMilliseconds.current = 0;
    cadencePauseTimer.current = null;
    lastKeyAt.current = 0;
    focusInput();
  };

  // A mode change deliberately creates a fresh session.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(restart, [mode]);

  useEffect(() => () => {
    if (cadencePauseTimer.current !== null) window.clearTimeout(cadencePauseTimer.current);
    const context = cadenceAudioContext.current;
    cadenceAudioContext.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => {
      const milliseconds = Math.round(isCadence ? activeElapsedAt(performance.now()) : performance.now() - startedAt.current);
      if (settings.sessionType === "time" && milliseconds >= settings.duration * 1000) {
        setElapsedMilliseconds(settings.duration * 1000);
        setStatus("done");
      } else setElapsedMilliseconds(milliseconds);
    }, 200);
    return () => window.clearInterval(timer);
  }, [status, settings.duration, settings.sessionType, isCadence]);

  useEffect(() => {
    if (!collectsAnalytics(mode) || status !== "done" || typed.length === 0) return;
    const result = calculateResult(mode, correct, typed.length, Math.max(1, elapsed));
    setAnalytics({ ...analytics, sessions: [result, ...analytics.sessions].slice(0, 20) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === settings.resetHotkey) {
      event.preventDefault();
      restart();
      return;
    }
    if (isCadence && cadencePauseTimer.current !== null) {
      event.preventDefault();
      return;
    }
    if (event.key === "Backspace" && status !== "done") {
      event.preventDefault();
      if (isCadence && typed.at(-1) === " ") return;
      if (typed.length > 0) setTyped(backspaceTypedCharacters(typed));
      return;
    }
    if (event.key.length !== 1 || status === "done") return;
    event.preventDefault();
    const now = performance.now();
    if (isCadence && settings.cadenceBlockSound) {
      const context = cadenceAudioContext.current ?? createCadenceAudioContext();
      cadenceAudioContext.current = context;
      if (context?.state === "suspended") void context.resume();
    }
    if (status === "idle") {
      setStatus("active");
      startedAt.current = now;
      if (isCadence) cadenceActiveStartedAt.current = now;
    }
    const index = typed.length;
    const expected = exercise.text[index];
    if (!expected) {
      setStatus("done");
      return;
    }
    if (isExtraWordCharacter(exercise.text, index, event.key)) return;
    if (isCadence && (event.key === " " || event.key === "Spacebar")) return;
    const typedKey = event.key.toLowerCase();
    const next = event.key === " " ? [...typed, ...advanceToNextWord(exercise.text, index)] : [...typed, typedKey];
    setTyped(next);
    if (collectsAnalytics(mode)) {
      setAnalytics(recordKeystroke(analytics, expected, typedKey, exercise.text[index - 1] ?? "", lastKeyAt.current ? now - lastKeyAt.current : 0));
    }
    lastKeyAt.current = now;
    const completesCadenceBlock = isCadence && expected !== " " && (exercise.text[index + 1] === " " || index === exercise.text.length - 1);
    if (isCadence && settings.sessionType === "time" && activeElapsedAt(now) >= settings.duration * 1000) {
      setElapsedMilliseconds(settings.duration * 1000);
      setStatus("done");
      return;
    }
    if (next.length >= exercise.text.length) {
      if (settings.sessionType !== "words") {
        appendExercise();
      } else {
        setElapsedMilliseconds(Math.round(isCadence ? activeElapsedAt(now) : now - startedAt.current));
        setStatus("done");
        return;
      }
    }
    if (completesCadenceBlock) {
      cadenceActiveMilliseconds.current = activeElapsedAt(now);
      cadenceActiveStartedAt.current = null;
      setCadencePaused(true);
      setElapsedMilliseconds(Math.round(cadenceActiveMilliseconds.current));
      cadencePauseTimer.current = window.setTimeout(() => {
        cadenceActiveStartedAt.current = performance.now();
        cadencePauseTimer.current = null;
        setCadencePaused(false);
        setTyped((current) => [...current, " "]);
        if (settings.cadenceBlockSound && cadenceAudioContext.current) void playCadenceBlockSound(cadenceAudioContext.current);
      }, settings.cadenceDelay * 1000);
    }
  };

  return {
    exercise, typed, status, elapsed, elapsedMilliseconds, accuracy, wpm_scaled, remaining, inputRef, restart, onKey, appendExercise,
    focus: focusInput,
    caretIndex: isCadence ? calculateCadenceCaretIndex(typed.length, cadencePaused) : typed.length,
    cadencePaused: isCadence && cadencePaused,
    characterCount: attempts,
    progress: Math.round(typed.length / exercise.text.length * 100),
  };
}

function TextStream({ text, typed, caretIndex, onNeedMore }: { text: string; typed: string[]; caretIndex: number; onNeedMore?: () => void }) {
  // Keep each word and its trailing separator in one wrapping unit. Rendering the
  // separator as a sibling lets the browser move it to the next visual line,
  // which makes that line appear indented.
  const tokens = useMemo(() => Array.from(text.matchAll(/\S+\s*/g), (match) => ({ token: match[0], startIndex: match.index })), [text]);
  const streamRef = useRef<HTMLDivElement>(null);
  const refillRequested = useRef(false);
  const [lineOffset, setLineOffset] = useState(0);

  useLayoutEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    // Recheck after every appended batch until the viewport has three lines.
    refillRequested.current = false;

    const positionCurrentLine = () => {
      const tokenElements = Array.from(stream.children) as HTMLElement[];
      const currentToken = tokenElements.find((element) => element.classList.contains("active-token"));
      if (!currentToken) return;

      const currentTop = currentToken.offsetTop;
      setLineOffset(currentTop);
      const followingLines = new Set(tokenElements.filter((element) => element.offsetTop >= currentTop).map((element) => element.offsetTop));
      // Keep one line beyond the viewport so all three visible lines are full.
      if (followingLines.size < 4 && onNeedMore && !refillRequested.current) {
        refillRequested.current = true;
        onNeedMore();
      }
    };

    positionCurrentLine();
    const observer = new ResizeObserver(positionCurrentLine);
    observer.observe(stream);
    return () => observer.disconnect();
  }, [text, caretIndex, onNeedMore]);

  return <div className="text-stream-viewport" aria-live="polite"><div ref={streamRef} className="text-stream" style={{ transform: `translateY(-${lineOffset}px)` }}>
    {tokens.map(({ token, startIndex }) => {
      const characters = token.split("").map((char, characterIndex) => {
        const index = startIndex + characterIndex;
        const typedState = index < typed.length ? (typed[index] === char ? "correct" : "incorrect") : "";
        const state = `${typedState}${index === caretIndex ? `${typedState ? " " : ""}current` : ""}`;
        return <span className={state} key={index}>{char === " " ? "\u00a0" : char}</span>;
      });
      const wordLength = token.search(/\s/);
      const endOfWord = wordLength === -1 ? token.length : wordLength;
      const isCurrentWord = caretIndex >= startIndex && caretIndex <= startIndex + endOfWord;
      return <span className={`typing-token${isCurrentWord ? " active-token" : ""}`} key={startIndex}>
        <span className={`typing-word${isCurrentWord ? " current-word" : ""}`}>{characters.slice(0, endOfWord)}</span>
        {characters.slice(endOfWord)}
      </span>;
    })}
  </div></div>;
}
