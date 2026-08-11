import { createElement, type ReactNode } from "react";
import type { TypingMode } from "../../lib/types";

const freedomIcon = createElement(
  "svg",
  {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  },
  createElement("circle", { cx: 12, cy: 12, r: 8 }),
  createElement("path", { d: "M12 4l-3-2M12 4l-3 2" }),
  createElement("path", { d: "M12 20l-3-2M12 20l-3 2" }),
);

export const MODES: { id: TypingMode; icon: ReactNode; title: string; header: string, home: string; help: string}[] = [
  { id: "flow", icon: "≈", title: "Flow", header: "Settle in and begin.",
    home: "Real words with repeated fingers far apart.", help: "The default mode for practicing flow. Words are generated to separate repeated use of the same finger. This behavior can be controlled by the minimum gap setting found under Settings." },
  { id: "zen", icon: "○", title: "Zen", header: "Focus.",
    home: "Random streams of letters to sharpen your focus.", help: "A more serious mode for practicing unusual letter combinations. Random blocks of letters are generated to separate repeated use of the same finger." },
  { id: "freedom", icon: freedomIcon, title: "Freedom", header: "Relax.",
    home: "Clear blocks of random letters in any order you choose.", help: "A mode to practice smooth typing without worrying about timing between fingers. You can clear the letters in each block in any order you like." },
  { id: "keyboardshot", icon: "⌨", title: "Keyboardshot", header: "React quickly.",
    home: "React quickly to multiple highlighted keys at a time.", help: "A fun mode inspired by gridshot from fps games. Type the highlighted keys as quickly as possible." },
  { id: "workout", icon: "↟", title: "Workout", header: "Workout.",
    home: "Focused bursts that strengthen one finger.", help: "A workout mode to train specific fingers. Choose the finger you want to practice in Settings. Letters are generated to focus on the selected finger." },
  { id: "practice", icon: "✦", title: "Practice", header: "Practice.",
    home: "Exercises shaped by your Flow results.", help: "A mode for improving your performance, with text generated from analytics collected during Flow sessions." },
];
