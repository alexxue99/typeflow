/* eslint-disable react-hooks/refs -- The session hook intentionally exposes its input ref and event handlers to its page component. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { calculateResult, collectsAnalytics, recordKeystroke } from "../../lib/analytics";
import { calculateFreedomWpmScaled, consumeBlockLetter, findIncompleteBlockLetters, isFreedomBlockComplete } from "../../lib/freedom";
import { generateExercise, generateZenSequence, rankTrouble } from "../../lib/generators";
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
  const freedomSession = useFreedomSession(mode, settings);
  const isFreedom = mode === "freedom";
  const session = isFreedom ? freedomSession : sequentialSession;
  const practiceTargets = mode === "practice" ? rankTrouble(analytics) : [];
  const [cursorShownByMouse, setCursorShownByMouse] = useState(false);
  const hideCursor = settings.hideCursorDuringTests && session.status === "active" && !cursorShownByMouse;
  // Freedom has no sequential letter position, so its caret remains under the
  // current block when the global letter-only underline is selected.
  const caretAppearance = isFreedom && settings.caretAppearance === "underline-letter" ? "underline" : settings.caretAppearance;

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
      {!isFreedom && sequentialSession.exercise.warning && <div className="notice">{sequentialSession.exercise.warning}</div>}
      {mode === "practice" && <div className="notice">{practiceTargets.length ? `This practice emphasizes "${practiceTargets.join(", ")}" based on your recent Flow performances.` : "Complete a few Flow sessions to unlock personalized exercises. This sample session is not added to your analytics."}</div>}
      <div className="stats-strip">
        <Metric label="WPM" value={Math.round(session.wpm_scaled / 100)} /><Metric label="Accuracy" value={`${session.accuracy}%`} />
        <Metric label={settings.sessionType === "time" ? "Remaining" : "Elapsed"} value={settings.sessionType === "time" ? `${session.remaining}s` : settings.sessionType === "words" ? `${(session.elapsedMilliseconds / 1000).toFixed(1)}s` : `${session.elapsed}s`} />
        <Metric label="Characters" value={session.characterCount} /><Metric label="Progress" value={settings.sessionType === "words" ? `${session.progress}%` : "—"} />
      </div>
      <div
        ref={isFreedom ? freedomSession.panelRef : undefined}
        className="typing-panel"
        data-caret={caretAppearance}
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
        {isFreedom && session.status === "idle" && <p className="freedom-idle-instruction">Type the letters in each block in any order.</p>}
        {isFreedom ? <FreedomStream blocks={freedomSession.blocks} consumed={freedomSession.consumed} incomplete={freedomSession.incomplete} currentBlock={freedomSession.currentBlock} done={session.status === "done"} onNeedMore={settings.sessionType === "words" ? undefined : freedomSession.append} /> : <TextStream text={sequentialSession.exercise.text} typed={sequentialSession.typed} onNeedMore={settings.sessionType === "words" ? undefined : sequentialSession.appendExercise} />}
        {!isFreedom && <input ref={sequentialSession.inputRef} className="typing-capture" onKeyDown={(event) => {
          if (event.key.length === 1 && event.key !== settings.resetHotkey && session.status !== "done") setCursorShownByMouse(false);
          sequentialSession.onKey(event);
        }} aria-label="Typing input" />}
        {session.status === "done" ? (
          <p className="typing-reset-prompt">Test finished! Press {settings.resetHotkey} to reset.</p>
        ) : (
          <p>{session.status === "idle" ? "Click anywhere here, then start typing. " : ""}{"Use Backspace to fix typos. "}Press {settings.resetHotkey} to reset.</p>
        )}
      </div>
      {session.status === "done" && <div className="result-card"><div><span className="eyebrow">Good job</span><h2>{settings.sessionType === "words" ? `${(session.elapsedMilliseconds / 1000).toFixed(3)}s` : `${session.wpm_scaled / 100} WPM`} · {session.accuracy}% accuracy</h2></div><div className="session-actions"><button className="icon-button" onClick={() => session.restart()} aria-label="Restart session">↻</button></div></div>}
      {(mode === "flow" || mode === "zen" || mode === "freedom") && <Leaderboard mode={mode} settings={settings} done={session.status === "done"} score={settings.sessionType === "words" ? session.elapsedMilliseconds : session.wpm_scaled} accuracy={session.accuracy} elapsed={settings.sessionType === "words" ? session.elapsedMilliseconds : session.elapsed} username={props.username} authAvailable={props.authAvailable} onSignIn={props.onSignIn} />}
    </section>
  );
}

function useTypingSession({ mode, settings, analytics, setAnalytics }: Omit<TypePageProps, "setMode" | "setSettings" | "username" | "authAvailable" | "onSignIn">) {
  const createExercise = (nextSettings = settings) => generateExercise(mode, nextSettings.mapping, nextSettings.minimumGap, nextSettings.wordCount, nextSettings.zenBlockSize, nextSettings.workoutFinger, nextSettings.workoutRepeats, analytics, nextSettings.useStandardLetterFrequency);
  const [exercise, setExercise] = useState(createExercise);
  const [typed, setTyped] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const startedAt = useRef(0);
  const lastKeyAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const correct = typed.filter((char, index) => char === exercise.text[index]).length;
  const accuracy = Math.round(correct / Math.max(1, typed.length) * 100);
  const elapsed = Math.floor(elapsedMilliseconds / 1000);
  const wpm_scaled = Math.round(((correct / 5) / Math.max(elapsedMilliseconds / 60000, 1 / 60)) * 100);
  const remaining = Math.max(0, settings.duration - elapsed);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });
  const appendExercise = useCallback(() => {
    const more = createExercise();
    setExercise((current) => ({ ...current, text: `${current.text} ${more.text}` }));
  // The generator intentionally uses the latest session settings when the viewport needs refilling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings, analytics]);
  const restart = (nextSettings = settings) => {
    setExercise(createExercise(nextSettings));
    setTyped([]);
    setElapsedMilliseconds(0);
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
      const milliseconds = Math.round(performance.now() - startedAt.current);
      if (settings.sessionType === "time" && milliseconds >= settings.duration * 1000) {
        setElapsedMilliseconds(settings.duration * 1000);
        setStatus("done");
      } else setElapsedMilliseconds(milliseconds);
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
      } else {
        setElapsedMilliseconds(Math.round(now - startedAt.current));
        setStatus("done");
      }
    }
  };

  return {
    exercise, typed, status, elapsed, elapsedMilliseconds, accuracy, wpm_scaled, remaining, inputRef, restart, onKey, appendExercise,
    focus: focusInput,
    characterCount: typed.length,
    progress: Math.round(typed.length / exercise.text.length * 100),
  };
}

type FreedomHit = { block: number; letter: number };

function useFreedomSession(mode: TypingMode, settings: Settings) {
  const makeBlocks = (nextSettings = settings) => generateZenSequence(nextSettings.mapping, nextSettings.minimumGap, nextSettings.wordCount, false, nextSettings.zenBlockSize, nextSettings.useStandardLetterFrequency).split(" ");
  const [blocks, setBlocks] = useState(makeBlocks);
  const [consumed, setConsumed] = useState<boolean[][]>(() => blocks.map((block) => Array(block.length).fill(false)));
  const [incomplete, setIncomplete] = useState<boolean[][]>(() => blocks.map((block) => Array(block.length).fill(false)));
  const [currentBlock, setCurrentBlock] = useState(0);
  const [history, setHistory] = useState<FreedomHit[]>([]);
  const [spaceHits, setSpaceHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [status, setStatus] = useState<"idle" | "active" | "done">("idle");
  const [feedback, setFeedback] = useState<"hit" | "miss" | "">("");
  const startedAt = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const hits = history.length;
  const accuracy = Math.round(hits / Math.max(1, attempts) * 100);
  const elapsed = Math.floor(elapsedMilliseconds / 1000);
  const wpm_scaled = calculateFreedomWpmScaled(hits, spaceHits, elapsedMilliseconds / 1000);
  const remaining = Math.max(0, settings.duration - elapsed);
  const totalLetters = blocks.reduce((sum, block) => sum + block.length, 0);
  const appendBlocks = useCallback(() => {
    const extra = makeBlocks();
    setBlocks((value) => [...value, ...extra]);
    setConsumed((value) => [...value, ...extra.map((block) => Array(block.length).fill(false))]);
    setIncomplete((value) => [...value, ...extra.map((block) => Array(block.length).fill(false))]);
  // The generator intentionally uses the latest session settings when the viewport needs refilling.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const restart = (nextSettings = settings) => {
    const nextBlocks = makeBlocks(nextSettings);
    setBlocks(nextBlocks);
    setConsumed(nextBlocks.map((block) => Array(block.length).fill(false)));
    setIncomplete(nextBlocks.map((block) => Array(block.length).fill(false)));
    setCurrentBlock(0);
    setHistory([]);
    setSpaceHits(0);
    setAttempts(0);
    setMisses(0);
    setElapsedMilliseconds(0);
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
      const milliseconds = Math.round(performance.now() - startedAt.current);
      if (settings.sessionType === "time" && milliseconds >= settings.duration * 1000) {
        setElapsedMilliseconds(settings.duration * 1000);
        setStatus("done");
      } else setElapsedMilliseconds(milliseconds);
    }, 200);
    return () => window.clearInterval(timer);
  }, [status, settings.duration, settings.sessionType]);

  const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === settings.resetHotkey) { event.preventDefault(); restart(); return; }
    if (status === "done") return;
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      const now = performance.now();
      if (status === "idle") { setStatus("active"); startedAt.current = now; }
      setSpaceHits((value) => value + 1);
      setIncomplete((value) => value.map((row, index) => index === currentBlock ? findIncompleteBlockLetters(consumed[currentBlock]) : row));
      setFeedback("");
      if (currentBlock === blocks.length - 1) {
        if (settings.sessionType !== "words") {
          appendBlocks();
          setCurrentBlock((value) => value + 1);
        } else {
          setElapsedMilliseconds(Math.round(now - startedAt.current));
          setStatus("done");
        }
      } else setCurrentBlock((value) => value + 1);
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const last = history.at(-1);
      if (!last) return;
      setConsumed((value) => value.map((row, blockIndex) => blockIndex === last.block ? row.map((used, letterIndex) => letterIndex === last.letter ? false : used) : row));
      setIncomplete((value) => value.map((row, blockIndex) => blockIndex === last.block ? row.map(() => false) : row));
      setHistory((value) => value.slice(0, -1));
      setCurrentBlock(last.block);
      setFeedback("");
      return;
    }
    if (!/^[a-z]$/i.test(event.key)) return;
    event.preventDefault();
    const now = performance.now();
    if (status === "idle") { setStatus("active"); startedAt.current = now; }
    const key = event.key.toLowerCase();
    const nextRow = consumeBlockLetter(blocks[currentBlock], consumed[currentBlock], key);
    setAttempts((value) => value + 1);
    if (!nextRow) { setMisses((value) => value + 1); setFeedback("miss"); return; }
    const letter = nextRow.findIndex((used, index) => used && !consumed[currentBlock][index]);
    setConsumed((value) => value.map((row, index) => index === currentBlock ? nextRow : row));
    setHistory((value) => [...value, { block: currentBlock, letter }]);
    setFeedback("hit");
    if (settings.sessionType === "words" && currentBlock === blocks.length - 1 && isFreedomBlockComplete(nextRow)) {
      setElapsedMilliseconds(Math.round(now - startedAt.current));
      setStatus("done");
    }
  };

  return {
    blocks, consumed, incomplete, currentBlock, status, elapsed, elapsedMilliseconds, accuracy, wpm_scaled, remaining, restart, onKey, panelRef,
    append: appendBlocks,
    focus: () => panelRef.current?.focus({ preventScroll: true }),
    characterCount: hits + spaceHits,
    progress: Math.round(hits / Math.max(1, totalLetters) * 100),
  };
}

function FreedomStream({ blocks, consumed, incomplete, currentBlock, done, onNeedMore }: { blocks: string[]; consumed: boolean[][]; incomplete: boolean[][]; currentBlock: number; done: boolean; onNeedMore?: () => void }) {
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
      {blocks.map((block, blockIndex) => <span key={blockIndex} className={`freedom-block${blockIndex === currentBlock && !done ? " current" : ""}`}>{block.split("").map((letter, letterIndex) => <span key={letterIndex} className={`freedom-letter${consumed[blockIndex][letterIndex] ? " consumed" : incomplete[blockIndex][letterIndex] ? " incomplete" : ""}`}>{letter}</span>)}</span>)}
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
