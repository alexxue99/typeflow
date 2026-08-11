import { useEffect, useRef, useState, type CSSProperties } from "react";
import { consumeBlockLetter } from "../../lib/freedom";
import { generateZenSequence } from "../../lib/generators";
import type { AnalyticsData, Settings, TypingMode } from "../../lib/types";
import { Metric } from "./Metric";
import { MODES } from "./modes";
import { ModeSettings } from "./ModeSettings";

type Props = { mode: TypingMode; setMode: (mode: TypingMode) => void; settings: Settings; setSettings: (settings: Settings) => void; analytics: AnalyticsData; setAnalytics: (data: AnalyticsData) => void };
type Hit = { block: number; letter: number };

export function FreedomPage({ setMode, settings, setSettings }: Props) {
  const makeBlocks = () => generateZenSequence(settings.mapping, settings.minimumGap, settings.wordCount, false, settings.zenBlockSize, settings.useStandardLetterFrequency).split(" ");
  const [blocks, setBlocks] = useState(makeBlocks);
  const [consumed, setConsumed] = useState<boolean[][]>(() => blocks.map((block) => Array(block.length).fill(false)));
  const [currentBlock, setCurrentBlock] = useState(0);
  const [history, setHistory] = useState<Hit[]>([]);
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

  const restart = () => {
    const nextBlocks = makeBlocks();
    setBlocks(nextBlocks); setConsumed(nextBlocks.map((block) => Array(block.length).fill(false)));
    setCurrentBlock(0); setHistory([]); setAttempts(0); setMisses(0); setElapsed(0);
    setStatus("idle"); setFeedback(""); startedAt.current = 0;
    panelRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => { panelRef.current?.focus({ preventScroll: true }); }, []);
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
    if (status === "done") return;
    if (event.key === "Backspace") {
      event.preventDefault();
      const last = history.at(-1);
      if (!last) return;
      setConsumed((value) => value.map((row, blockIndex) => blockIndex === last.block ? row.map((used, letterIndex) => letterIndex === last.letter ? false : used) : row));
      setHistory((value) => value.slice(0, -1)); setCurrentBlock(last.block); setFeedback("");
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
    setHistory((value) => [...value, { block: currentBlock, letter }]); setFeedback("hit");
    if (nextRow.every(Boolean)) {
      if (currentBlock === blocks.length - 1) {
        if (settings.sessionType !== "words") {
          const extra = makeBlocks();
          setBlocks((value) => [...value, ...extra]);
          setConsumed((value) => [...value, ...extra.map((block) => Array(block.length).fill(false))]);
          setCurrentBlock((value) => value + 1);
        } else setStatus("done");
      }
      else setCurrentBlock((value) => value + 1);
    }
  };

  return <section className="type-page">
    <div className="mode-tabs">{MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={item.id === "freedom" ? "active" : ""}>{item.title}</button>)}</div>
    <div className="session-head"><div><span className="eyebrow">Freedom session</span><h1>{status === "done" ? "Session complete" : MODES.find((m) => m.id === "freedom")?.header}</h1></div><div className="session-actions"><button className="icon-button" onClick={restart} aria-label="Restart session">↻</button></div></div>
    <ModeSettings mode="freedom" settings={settings} setSettings={setSettings} onRestart={restart} />
    <div className="stats-strip"><Metric label="WPM" value={wpm} /><Metric label="Accuracy" value={`${accuracy}%`} /><Metric label={settings.sessionType === "timed" ? "Remaining" : "Elapsed"} value={`${settings.sessionType === "timed" ? remaining : elapsed}s`} /><Metric label="Characters" value={hits} /><Metric label="Progress" value={`${Math.round(hits / Math.max(1, totalLetters) * 100)}%`} /></div>
    <div ref={panelRef} className="typing-panel" tabIndex={0} onKeyDown={onKeyDown} onClick={() => panelRef.current?.focus()} style={{ fontSize: settings.fontSize, "--caret-color": settings.caretColor } as CSSProperties} aria-label="Freedom typing input">
      <div className="freedom-stream" aria-live="polite">{blocks.map((block, blockIndex) => <span key={blockIndex} className={`freedom-block${blockIndex === currentBlock && status !== "done" ? " current" : ""}`}>{block.split("").map((letter, letterIndex) => <span key={letterIndex} className={`freedom-letter${consumed[blockIndex][letterIndex] ? " consumed" : ""}`}>{letter}</span>)}</span>)}</div>
      <div className={`keyboardshot-status ${feedback}`}>{status === "idle" ? "Type the letters in the highlighted block in any order." : status === "done" ? `${hits} letters · ${accuracy}% accuracy` : feedback === "miss" ? `That letter is not available in this block (${misses} misses)` : "Keep clearing the highlighted block."}</div>
    </div>
    {status === "done" && <div className="result-card"><div><span className="eyebrow">Good job</span><h2>{wpm} WPM · {accuracy}% accuracy</h2></div><button className="primary" onClick={restart}>Practice again</button></div>}
  </section>;
}
