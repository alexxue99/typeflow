/* eslint-disable react-hooks/refs -- The session hook intentionally exposes its input ref and event handlers to its page component. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { calculateResult, collectsAnalytics, recordKeystroke } from "../../lib/analytics";
import { generateExercise, rankTrouble } from "../../lib/generators";
import { advanceToNextWord, backspaceTypedCharacters, isExtraWordCharacter } from "../../lib/typing";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { KeyboardshotPage } from "./KeyboardshotPage";
import { FreedomPage } from "./FreedomPage";
import { ModeSettings } from "./ModeSettings";

type TypePageProps = {
  mode: TypingMode;
  setMode: (mode: TypingMode) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  analytics: AnalyticsData;
  setAnalytics: (data: AnalyticsData) => void;
};

export function TypePage(props: TypePageProps) {
  if (props.mode === "keyboardshot") return <KeyboardshotPage {...props} />;
  if (props.mode === "freedom") return <FreedomPage {...props} />;
  return <StandardTypingPage {...props} />;
}

function StandardTypingPage(props: TypePageProps) {
  const { mode, setMode, settings, setSettings, analytics } = props;
  const session = useTypingSession(props);
  const practiceTargets = mode === "practice" ? rankTrouble(analytics) : [];

  return (
    <section className="type-page">
      <div className="mode-tabs">
        {MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={mode === item.id ? "active" : ""}>{item.title}</button>)}
      </div>
      <div className="session-head">
        <div><span className="eyebrow">{mode} session</span><h1>{session.status === "done" ? "Session complete." : MODES.find((m) => m.id === mode)?.header}</h1></div>
        <div className="session-actions"><button className="icon-button" onClick={session.restart} aria-label="Restart session">↻</button></div>
      </div>
      <ModeSettings mode={mode} settings={settings} setSettings={setSettings} onRestart={session.restart} />
      {session.exercise.warning && <div className="notice">{session.exercise.warning}</div>}
      {mode === "practice" && <div className="notice">{practiceTargets.length ? `Today’s practice emphasizes ${practiceTargets.join(", ")} because these were among your toughest recent Flow sequences.` : "Complete a few Flow sessions to unlock personalized exercises. This sample session is not added to your analytics."}</div>}
      <div className="stats-strip">
        <Metric label="WPM" value={session.wpm} /><Metric label="Accuracy" value={`${session.accuracy}%`} />
        <Metric label={settings.sessionType === "timed" ? "Remaining" : "Elapsed"} value={`${settings.sessionType === "timed" ? session.remaining : session.elapsed}s`} />
        <Metric label="Characters" value={session.typed.length} /><Metric label="Progress" value={`${Math.round(session.typed.length / session.exercise.text.length * 100)}%`} />
      </div>
      <div
        className="typing-panel"
        data-caret={settings.caretAppearance}
        data-caret-blink={settings.caretBlink ? "on" : "off"}
        onClick={session.focusInput}
        style={{ fontSize: settings.fontSize, "--caret-color": settings.caretColor } as CSSProperties}
      >
        <TextStream
          text={session.exercise.text}
          typed={session.typed}
          onNeedMore={settings.sessionType === "words" ? undefined : session.appendExercise}
        />
        <input ref={session.inputRef} className="typing-capture" onKeyDown={session.onKey} aria-label="Typing input" />
        <p>{session.status === "idle" ? "Click anywhere here, then start typing. " : ""}Use Backspace to fix typos. Press {settings.resetHotkey} to reset.</p>
      </div>
      {session.status === "done" && <div className="result-card"><div><span className="eyebrow">Good job</span><h2>{session.wpm} WPM · {session.accuracy}% accuracy</h2></div><button className="primary" onClick={session.restart}>Practice again</button></div>}
    </section>
  );
}

function useTypingSession({ mode, settings, analytics, setAnalytics }: Omit<TypePageProps, "setMode" | "setSettings">) {
  const createExercise = () => generateExercise(mode, settings.mapping, settings.minimumGap, settings.wordCount, settings.checkBetweenWords, settings.zenBlockSize, settings.workoutFinger, settings.workoutRepeats, analytics, settings.useStandardLetterFrequency);
  const [exercise, setExercise] = useState(createExercise);
  const [typed, setTyped] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const lastKeyAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const correct = typed.filter((char, index) => char === exercise.text[index]).length;
  const accuracy = Math.round(correct / Math.max(1, typed.length) * 100);
  const wpm = Math.round((correct / 5) / Math.max(elapsed / 60, 1 / 60));
  const remaining = Math.max(0, settings.duration - elapsed);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });
  const appendExercise = useCallback(() => {
    const more = createExercise();
    setExercise((current) => ({ ...current, text: `${current.text} ${more.text}` }));
  // The generator intentionally uses the latest session settings when the viewport needs refilling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings, analytics]);
  const restart = () => {
    setExercise(createExercise());
    setTyped([]);
    setElapsed(0);
    setStatus("idle");
    startedAt.current = 0;
    lastKeyAt.current = 0;
    focusInput();
  };

  // A mode change deliberately creates a fresh session.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(restart, [mode]);

  useEffect(() => {
    if (status !== "active") return;
    const timer = window.setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAt.current) / 1000);
      setElapsed(seconds);
      if (settings.sessionType === "timed" && seconds >= settings.duration) setStatus("done");
    }, 200);
    return () => window.clearInterval(timer);
  }, [status, settings.duration, settings.sessionType]);

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
    if (event.key === "Backspace" && status !== "done") {
      event.preventDefault();
      if (typed.length > 0) setTyped(backspaceTypedCharacters(typed));
      return;
    }
    if (event.key.length !== 1 || status === "done") return;
    event.preventDefault();
    const now = performance.now();
    if (status === "idle") {
      setStatus("active");
      startedAt.current = now;
    }
    const index = typed.length;
    const expected = exercise.text[index];
    if (!expected) {
      setStatus("done");
      return;
    }
    if (isExtraWordCharacter(exercise.text, index, event.key)) return;
    const typedKey = event.key.toLowerCase();
    const next = event.key === " " ? [...typed, ...advanceToNextWord(exercise.text, index)] : [...typed, typedKey];
    setTyped(next);
    if (collectsAnalytics(mode)) {
      setAnalytics(recordKeystroke(analytics, expected, typedKey, exercise.text[index - 1] ?? "", lastKeyAt.current ? now - lastKeyAt.current : 0));
    }
    lastKeyAt.current = now;
    if (next.length >= exercise.text.length) {
      if (settings.sessionType !== "words") {
        appendExercise();
      } else setStatus("done");
    }
  };

  return { exercise, typed, status, elapsed, accuracy, wpm, remaining, inputRef, focusInput, restart, onKey, appendExercise };
}

function TextStream({ text, typed, onNeedMore }: { text: string; typed: string[]; onNeedMore?: () => void }) {
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

    const positionCurrentLine = () => {
      const tokenElements = Array.from(stream.children) as HTMLElement[];
      const currentToken = tokenElements.find((element) => element.classList.contains("active-token"));
      if (!currentToken) return;

      const currentTop = currentToken.offsetTop;
      setLineOffset(currentTop);
      const followingLines = new Set(tokenElements.filter((element) => element.offsetTop >= currentTop).map((element) => element.offsetTop));
      if (followingLines.size < 3 && onNeedMore && !refillRequested.current) {
        refillRequested.current = true;
        onNeedMore();
      }
    };

    positionCurrentLine();
    const observer = new ResizeObserver(positionCurrentLine);
    observer.observe(stream);
    return () => observer.disconnect();
  }, [text, typed.length, onNeedMore]);

  useEffect(() => { refillRequested.current = false; }, [text]);

  return <div className="text-stream-viewport" aria-live="polite"><div ref={streamRef} className="text-stream" style={{ transform: `translateY(-${lineOffset}px)` }}>
    {tokens.map(({ token, startIndex }) => {
      const characters = token.split("").map((char, characterIndex) => {
        const index = startIndex + characterIndex;
        const state = index < typed.length ? (typed[index] === char ? "correct" : "incorrect") : index === typed.length ? "current" : "";
        return <span className={state} key={index}>{char === " " ? "\u00a0" : char}</span>;
      });
      const wordLength = token.search(/\s/);
      const endOfWord = wordLength === -1 ? token.length : wordLength;
      const isCurrentWord = typed.length >= startIndex && typed.length <= startIndex + endOfWord;
      return <span className={`typing-token${isCurrentWord ? " active-token" : ""}`} key={startIndex}>
        <span className={`typing-word${isCurrentWord ? " current-word" : ""}`}>{characters.slice(0, endOfWord)}</span>
        {characters.slice(endOfWord)}
      </span>;
    })}
  </div></div>;
}
