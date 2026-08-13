/* eslint-disable react-hooks/refs -- The session hook intentionally exposes its input ref and event handlers to its page component. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { calculateResult, collectsAnalytics, recordKeystroke } from "../../lib/analytics";
import { consumeBlockLetter } from "../../lib/freedom";
import { generateExercise, generateZenSequence, rankTrouble } from "../../lib/generators";
import { advanceToNextWord, backspaceTypedCharacters, isExtraWordCharacter } from "../../lib/typing";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { KeyboardshotPage } from "./KeyboardshotPage";
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
  return <SequentialTypingPage {...props} />;
}

function SequentialTypingPage(props: TypePageProps) {
  const { mode, setMode, settings, setSettings, analytics } = props;
  const sequentialSession = useTypingSession(props);
  const freedomSession = useFreedomSession(mode, settings);
  const isFreedom = mode === "freedom";
  const session = isFreedom ? freedomSession : sequentialSession;
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
        <div className="session-actions"><button className="icon-button" onClick={session.restart} aria-label="Restart session">↻</button></div>
      </div>
      <ModeSettings mode={mode} settings={settings} setSettings={setSettings} onRestart={session.restart} />
      {!isFreedom && sequentialSession.exercise.warning && <div className="notice">{sequentialSession.exercise.warning}</div>}
      {mode === "practice" && <div className="notice">{practiceTargets.length ? `This practice emphasizes "${practiceTargets.join(", ")}" based on your recent Flow performances.` : "Complete a few Flow sessions to unlock personalized exercises. This sample session is not added to your analytics."}</div>}
      <div className="stats-strip">
        <Metric label="WPM" value={session.wpm} /><Metric label="Accuracy" value={`${session.accuracy}%`} />
        <Metric label={settings.sessionType === "timed" ? "Remaining" : "Elapsed"} value={`${settings.sessionType === "timed" ? session.remaining : session.elapsed}s`} />
        <Metric label="Characters" value={session.characterCount} /><Metric label="Progress" value={settings.sessionType === "words" ? `${session.progress}%` : '--'} />
      </div>
      <div
        ref={isFreedom ? freedomSession.panelRef : undefined}
        className="typing-panel"
        data-caret={settings.caretAppearance}
        data-caret-blink={settings.caretBlink ? "on" : "off"}
        onClick={session.focus}
        onKeyDown={isFreedom ? (event) => {
          if (/^[a-z]$/i.test(event.key) && event.key !== settings.resetHotkey && session.status !== "done") setCursorShownByMouse(false);
          freedomSession.onKey(event);
        } : undefined}
        tabIndex={isFreedom ? 0 : undefined}
        aria-label={isFreedom ? "Freedom typing input" : undefined}
        style={{ fontSize: settings.fontSize, "--caret-color": settings.caretColor } as CSSProperties}
      >
        {isFreedom ? <FreedomStream blocks={freedomSession.blocks} consumed={freedomSession.consumed} currentBlock={freedomSession.currentBlock} done={session.status === "done"} onNeedMore={settings.sessionType === "words" ? undefined : freedomSession.append} /> : <TextStream text={sequentialSession.exercise.text} typed={sequentialSession.typed} onNeedMore={settings.sessionType === "words" ? undefined : sequentialSession.appendExercise} />}
        {!isFreedom && <input ref={sequentialSession.inputRef} className="typing-capture" onKeyDown={(event) => {
          if (event.key.length === 1 && event.key !== settings.resetHotkey && session.status !== "done") setCursorShownByMouse(false);
          sequentialSession.onKey(event);
        }} aria-label="Typing input" />}
        <p>{isFreedom ? freedomSession.message : <>{session.status === "idle" ? "Click anywhere here, then start typing. " : ""}Use Backspace to fix typos. Press {settings.resetHotkey} to reset.</>}</p>
      </div>
      {session.status === "done" && <div className="result-card"><div><span className="eyebrow">Good job</span><h2>{session.wpm} WPM · {session.accuracy}% accuracy</h2></div><button className="primary" onClick={session.restart}>Practice again</button></div>}
    </section>
  );
}

function useTypingSession({ mode, settings, analytics, setAnalytics }: Omit<TypePageProps, "setMode" | "setSettings">) {
  const createExercise = () => generateExercise(mode, settings.mapping, settings.minimumGap, settings.wordCount, settings.checkBetweenWords && mode !== "freedom", settings.zenBlockSize, settings.workoutFinger, settings.workoutRepeats, analytics, settings.useStandardLetterFrequency);
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

  return {
    exercise, typed, status, elapsed, accuracy, wpm, remaining, inputRef, restart, onKey, appendExercise,
    focus: focusInput,
    characterCount: typed.length,
    progress: Math.round(typed.length / exercise.text.length * 100),
  };
}

type FreedomHit = { block: number; letter: number };

function useFreedomSession(mode: TypingMode, settings: Settings) {
  const makeBlocks = () => generateZenSequence(settings.mapping, settings.minimumGap, settings.wordCount, false, settings.zenBlockSize, settings.useStandardLetterFrequency).split(" ");
  const [blocks, setBlocks] = useState(makeBlocks);
  const [consumed, setConsumed] = useState<boolean[][]>(() => blocks.map((block) => Array(block.length).fill(false)));
  const [currentBlock, setCurrentBlock] = useState(0);
  const [history, setHistory] = useState<FreedomHit[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [feedback, setFeedback] = useState<"hit" | "miss" | "">("");
  const startedAt = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const hits = history.length;
  const accuracy = Math.round(hits / Math.max(1, attempts) * 100);
  const wpm = Math.round((hits / 5) / Math.max(elapsed / 60, 1 / 60));
  const remaining = Math.max(0, settings.duration - elapsed);
  const totalLetters = blocks.reduce((sum, block) => sum + block.length, 0);
  const appendBlocks = useCallback(() => {
    const extra = makeBlocks();
    setBlocks((value) => [...value, ...extra]);
    setConsumed((value) => [...value, ...extra.map((block) => Array(block.length).fill(false))]);
  // The generator intentionally uses the latest session settings when the viewport needs refilling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const restart = () => {
    const nextBlocks = makeBlocks();
    setBlocks(nextBlocks);
    setConsumed(nextBlocks.map((block) => Array(block.length).fill(false)));
    setCurrentBlock(0);
    setHistory([]);
    setAttempts(0);
    setMisses(0);
    setElapsed(0);
    setStatus("idle");
    setFeedback("");
    startedAt.current = 0;
    panelRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => { panelRef.current?.focus({ preventScroll: true }); }, []);
  // Switching modes starts a fresh Freedom session, matching the other typing modes.
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

  const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === settings.resetHotkey) { event.preventDefault(); restart(); return; }
    if (status === "done") return;
    if (event.key === " " || event.key === "Spacebar") { event.preventDefault(); return; }
    if (event.key === "Backspace") {
      event.preventDefault();
      const last = history.at(-1);
      if (!last) return;
      setConsumed((value) => value.map((row, blockIndex) => blockIndex === last.block ? row.map((used, letterIndex) => letterIndex === last.letter ? false : used) : row));
      setHistory((value) => value.slice(0, -1));
      setCurrentBlock(last.block);
      setFeedback("");
      return;
    }
    if (!/^[a-z]$/i.test(event.key)) return;
    event.preventDefault();
    if (status === "idle") { setStatus("active"); startedAt.current = performance.now(); }
    const key = event.key.toLowerCase();
    const nextRow = consumeBlockLetter(blocks[currentBlock], consumed[currentBlock], key);
    setAttempts((value) => value + 1);
    if (!nextRow) { setMisses((value) => value + 1); setFeedback("miss"); return; }
    const letter = nextRow.findIndex((used, index) => used && !consumed[currentBlock][index]);
    setConsumed((value) => value.map((row, index) => index === currentBlock ? nextRow : row));
    setHistory((value) => [...value, { block: currentBlock, letter }]);
    setFeedback("hit");
    if (nextRow.every(Boolean)) {
      if (currentBlock === blocks.length - 1) {
        if (settings.sessionType !== "words") {
          appendBlocks();
          setCurrentBlock((value) => value + 1);
        } else setStatus("done");
      } else setCurrentBlock((value) => value + 1);
    }
  };

  const message = status === "idle"
    ? "Type the letters in the current block in any order."
    : status === "done"
      ? `${hits} letters · ${accuracy}% accuracy`
      : feedback === "miss"
        ? `That letter is not available in this block (${misses} misses)`
        : "Keep clearing the current block.";

  return {
    blocks, consumed, currentBlock, status, elapsed, accuracy, wpm, remaining, restart, onKey, message, panelRef,
    append: appendBlocks,
    focus: () => panelRef.current?.focus({ preventScroll: true }),
    characterCount: hits,
    progress: Math.round(hits / Math.max(1, totalLetters) * 100),
  };
}

function FreedomStream({ blocks, consumed, currentBlock, done, onNeedMore }: { blocks: string[]; consumed: boolean[][]; currentBlock: number; done: boolean; onNeedMore?: () => void }) {
  const streamRef = useRef<HTMLDivElement>(null);
  const refillRequested = useRef(false);
  const [lineOffset, setLineOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>();

  useLayoutEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    // A newly appended batch gets its own refill opportunity. Some modes
    // generate short batches, so filling three lines can require more than one.
    refillRequested.current = false;
    const positionCurrentLine = () => {
      const blockElements = Array.from(stream.children) as HTMLElement[];
      if (!blockElements.length) return;
      const lineTops = [...new Set(blockElements.map((element) => element.offsetTop))];
      const thirdLineTop = lineTops.slice(0, 3).at(-1) ?? 0;
      const thirdLineBlock = blockElements.find((element) => element.offsetTop === thirdLineTop);
      setViewportHeight((thirdLineBlock?.offsetTop ?? 0) + (thirdLineBlock?.offsetHeight ?? 0));
      const currentTop = blockElements[currentBlock]?.offsetTop ?? 0;
      setLineOffset(currentTop);
      const followingLines = new Set(blockElements.filter((element) => element.offsetTop >= currentTop).map((element) => element.offsetTop));
      // The fourth line acts as proof that the third visible line wrapped
      // naturally instead of merely containing one or two trailing words.
      if (followingLines.size < 4 && onNeedMore && !refillRequested.current) {
        refillRequested.current = true;
        onNeedMore();
      }
    };
    positionCurrentLine();
    const observer = new ResizeObserver(positionCurrentLine);
    observer.observe(stream);
    return () => observer.disconnect();
  }, [blocks, currentBlock, onNeedMore]);

  return <div className="freedom-stream-viewport" style={viewportHeight ? { height: viewportHeight } : undefined} aria-live="polite">
    <div ref={streamRef} className="freedom-stream" style={{ transform: `translateY(-${lineOffset}px)` }}>
      {blocks.map((block, blockIndex) => <span key={blockIndex} className={`freedom-block${blockIndex === currentBlock && !done ? " current" : ""}`}>{block.split("").map((letter, letterIndex) => <span key={letterIndex} className={`freedom-letter${consumed[blockIndex][letterIndex] ? " consumed" : ""}`}>{letter}</span>)}</span>)}
    </div>
  </div>;
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
  }, [text, typed.length, onNeedMore]);

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
