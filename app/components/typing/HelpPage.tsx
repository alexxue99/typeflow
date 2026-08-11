import { MODES } from "./modes";

export function HelpPage() {
  return <section className="content-page help-page"><span className="eyebrow">A short guide</span><h1>Practice with intention.</h1>
    <div className="help-grid">
      {MODES.map((mode) => <article key={mode.id}><span className="mode-icon">{mode.icon}</span><h2>{mode.title}</h2><p>{mode.help}</p></article>)}
      <article><h2>What is finger gap?</h2><p>A gap of 1 prevents the same finger from typing consecutive letters. Higher values require more letters between consecutive uses of the same finger, including across words if desired (using the &quot;check between words&quot; setting).</p></article>
      <article><h2>What is standard letter frequency?</h2><p>Standard letter frequency refers to the typical occurrence rate of each letter in English. Using this setting helps create more realistic typing exercises by generating letter sequences based on how often each letter appears in real text.</p></article>
      <article><h2>How analytics work</h2><p>During Flow sessions, keystroke timing, accuracy, letter attempts, bigrams, and recent results are stored locally. Other modes do not contribute analytics. Long pauses are excluded from normal speed samples.</p></article>
    </div>
  </section>;
}
