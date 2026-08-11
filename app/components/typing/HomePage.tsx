import type { TypingMode } from "../../lib/types";
import { MODES } from "./modes";

export function HomePage({ onStart }: { onStart: (mode: TypingMode) => void }) {
  return (
    <section className="home-page">
      {/* <div className="eyebrow">Your daily typing space</div> */}
      <h1>Find your rhythm.<br /><em>Build your flow.</em></h1>
      <p className="lead">A calm place to practice smooth typing. No accounts, no leaderboards—just you and the next key.</p>
      <div className="mode-grid">
        {MODES.map((item, index) => (
          <article className={`mode-card tone-${index}`} key={item.id}>
            <span className="mode-icon">{item.icon}</span>
            <h2>{item.title}</h2><p>{item.home}</p>
            <button onClick={() => onStart(item.id)}>Start {item.title} <span>→</span></button>
          </article>
        ))}
      </div>
      <div className="home-note"><span>⌁</span><p><strong>Practice that adapts.</strong><br />After a few Flow sessions, Practice mode quietly emphasizes the letters and pairs that need more attention.</p></div>
    </section>
  );
}
