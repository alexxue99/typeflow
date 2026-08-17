import { useMemo } from "react";
import { DEFAULT_MAPPING, FINGER_LABELS } from "../../lib/defaults";
import { FINGERS, type Finger, type Settings } from "../../lib/types";

type SettingsPageProps = {
  settings: Settings;
  setSettings: (settings: Settings) => void;
};

export function SettingsPage({ settings, setSettings }: SettingsPageProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ ...settings, [key]: value });
  const mappingIssues = useMemo(() => getMappingIssues(settings), [settings]);
  const changeKeys = (finger: Finger, value: string) => {
    const keys = [...new Set(value.toLowerCase().replace(/[^a-z]/g, "").split(""))];
    update("mapping", { ...settings.mapping, [finger]: keys });
  };

  return (
    <section className="content-page settings-page">
      <div className="page-title"><div><span className="eyebrow">Make it yours</span><h1>Settings</h1><p>Changes save automatically in this browser.</p></div></div>
      <div className="settings-grid">
        <fieldset><legend>General</legend>
          <label>Reset hotkey<select value={settings.resetHotkey} onChange={(e) => update("resetHotkey", e.target.value)}><option value="Tab">Tab</option><option value="Enter">Enter</option><option value="Backspace">Backspace</option><option value="Delete">Delete</option><option value="`">Backtick (`)</option></select></label>
          <label className="check-row"><input type="checkbox" checked={settings.hideCursorDuringTests} onChange={(e) => update("hideCursorDuringTests", e.target.checked)} /> Hide cursor during tests</label>
        </fieldset>
        <fieldset><legend>Appearance</legend>
          <label>Theme<select value={settings.theme} onChange={(e) => update("theme", e.target.value as Settings["theme"])}>{["light", "dark", "paper", "forest", "ocean", "lavender", "contrast"].map((theme) => <option value={theme} key={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>)}</select></label>
          <label>Typing font size <strong>{settings.fontSize}px</strong><input type="range" min="22" max="44" value={settings.fontSize} onChange={(e) => update("fontSize", Number(e.target.value))} /></label>
          <label>Caret appearance<select value={settings.caretAppearance} onChange={(e) => update("caretAppearance", e.target.value as Settings["caretAppearance"])}><option value="highlight">Highlighted character</option><option value="underline">Underline word</option><option value="underline-letter">Underline letter</option><option value="invisible">Invisible</option></select></label>
          <label className="color-row">Caret color<input type="color" value={settings.caretColor} onChange={(e) => update("caretColor", e.target.value)} /></label>
          <label className="check-row"><input type="checkbox" checked={settings.caretBlink} onChange={(e) => update("caretBlink", e.target.checked)} /> Caret blink</label>
          <label className="check-row"><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => update("reducedMotion", e.target.checked)} /> Reduce motion</label>
        </fieldset>
      </div>
      <fieldset className="mapping-fieldset"><legend>Finger-to-key mapping</legend><p>Type lowercase letters into each field. Spaces and punctuation are ignored.</p>
        <div className="mapping-grid">{FINGERS.map((finger) => <label key={finger}>{FINGER_LABELS[finger]}<input value={settings.mapping[finger].join("")} onChange={(e) => changeKeys(finger, e.target.value)} /></label>)}</div>
        {mappingIssues.length > 0 && <div className="warning-list">{mappingIssues.map((issue) => <p key={issue}>⚠ {issue}</p>)}</div>}
        <button onClick={() => update("mapping", DEFAULT_MAPPING)}>Reset standard mapping</button>
      </fieldset>
    </section>
  );
}

function getMappingIssues(settings: Settings) {
  const all = Object.values(settings.mapping).flat();
  const duplicate = all.find((key, index) => all.indexOf(key) !== index);
  const missing = "abcdefghijklmnopqrstuvwxyz".split("").filter((key) => !all.includes(key));
  const empty = FINGERS.filter((finger) => settings.mapping[finger].length === 0);
  return [
    duplicate && `“${duplicate}” is assigned more than once.`,
    missing.length && `Unassigned letters: ${missing.join(", ")}.`,
    empty.length && `No keys assigned to: ${empty.map((finger) => FINGER_LABELS[finger]).join(", ")}.`,
  ].filter(Boolean) as string[];
}
