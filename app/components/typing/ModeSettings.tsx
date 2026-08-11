import { FINGER_LABELS } from "../../lib/defaults";
import { FINGERS, type Finger, type Settings, type TypingMode } from "../../lib/types";

type Props = { mode: TypingMode; settings: Settings; setSettings: (settings: Settings) => void; onRestart: () => void };

export function ModeSettings({ mode, settings, setSettings, onRestart }: Props) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ ...settings, [key]: value });
  const sequenceMode = mode === "flow" || mode === "zen" || mode === "freedom";

  return <details className="mode-settings">
    <summary>Mode settings</summary>
    <div className="mode-settings-grid">
      <label>Session type<select value={settings.sessionType} onChange={(e) => update("sessionType", e.target.value as Settings["sessionType"])}><option value="timed">Timed</option><option value="words">Words</option><option value="endless">Endless</option></select></label>
      {settings.sessionType === "timed" && <label>Timer duration<select value={settings.duration} onChange={(e) => update("duration", Number(e.target.value))}>{[15, 30, 60, 120].map((n) => <option key={n} value={n}>{n} seconds</option>)}</select></label>}
      {settings.sessionType === "words" && <label>{mode === "keyboardshot" ? "Target count" : "Word count"}<input type="number" min="1" max="1000" value={settings.wordCount} onChange={(e) => update("wordCount", Math.max(1, Number(e.target.value)))} /></label>}
      {sequenceMode && <label>Minimum finger gap <strong>{settings.minimumGap === 0 ? "0 (off)" : settings.minimumGap}</strong><input type="range" min="0" max="4" value={settings.minimumGap} onChange={(e) => update("minimumGap", Number(e.target.value))} /></label>}
      {mode === "keyboardshot" && <label>Number of highlighted keys <strong>{settings.keyboardshotTargetCount}</strong><input type="range" min="1" max="6" value={settings.keyboardshotTargetCount} onChange={(e) => update("keyboardshotTargetCount", Number(e.target.value))} /></label>}
      {(sequenceMode || mode === "keyboardshot") && <label className="check-row"><input type="checkbox" checked={settings.useStandardLetterFrequency} onChange={(e) => update("useStandardLetterFrequency", e.target.checked)} /> Use standard letter frequency</label>}
      {(mode === "flow" || mode === "zen") && <label className="check-row"><input type="checkbox" checked={settings.checkBetweenWords} onChange={(e) => update("checkBetweenWords", e.target.checked)} /> Check between words</label>}
      {(mode === "zen" || mode === "freedom") && <label>Block size <strong>{settings.zenBlockSize}</strong><input type="range" min="1" max="10" value={settings.zenBlockSize} onChange={(e) => update("zenBlockSize", Number(e.target.value))} /></label>}
      {mode === "keyboardshot" && <label className="check-row"><input type="checkbox" checked={settings.keyboardshotGlowFade} onChange={(e) => update("keyboardshotGlowFade", e.target.checked)} /> Fade in newly highlighted keys</label>}
      {mode === "keyboardshot" && <label className="check-row"><input type="checkbox" checked={settings.keyboardshotHitSounds} onChange={(e) => update("keyboardshotHitSounds", e.target.checked)} /> Play hit and miss sounds</label>}
      {mode === "workout" && <label>Workout finger<select value={settings.workoutFinger} onChange={(e) => update("workoutFinger", e.target.value as Finger)}>{FINGERS.map((finger) => <option value={finger} key={finger}>{FINGER_LABELS[finger]}</option>)}</select></label>}
      {mode === "workout" && <label>Consecutive uses<input type="number" min="2" max="8" value={settings.workoutRepeats} onChange={(e) => update("workoutRepeats", Number(e.target.value))} /></label>}
    </div>
    <button className="mode-settings-apply" onClick={onRestart}>Apply and restart</button>
  </details>;
}
