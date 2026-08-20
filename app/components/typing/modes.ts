import { createElement, type ReactNode } from "react";
import type { TypingMode } from "../../lib/types";

const cadenceIcon = createElement(
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
  createElement("path", { d: "M9.5 5h5L17 20H7L9.5 5Z" }),
  createElement("path", { d: "M12 16 16 4" }),
  createElement("circle", { cx: 16.5, cy: 3.5, r: 1.5 }),
  createElement("path", { d: "M6 20h12" }),
);

export const MODES: { id: TypingMode; icon: ReactNode; title: string; header: string, home: string; help: string}[] = [
  { id: "flow", icon: "≈", title: "Flow", header: "Settle in and begin.",
    home: "Real words generated to help your fingers flow.",
    help: "The default mode for practicing flow. Utilize the finger gaps by preparing fingers in advance and intentionally increasing your typing cadence."},
  { id: "zen", icon: "z", title: "Zen", header: "Focus.",
    home: "Random streams of letters to sharpen your focus.",
    help: "A more serious mode for practicing unusual letter combinations. Use this mode to actively stretch your fingers. Relax your fingers while reaching for the letter combinations."},
  { id: "cadence", icon: cadenceIcon, title: "Cadence", header: "Feel the rhythm.",
    home: "Type random blocks that advance on a steady rhythm.",
    help: "A rhythmic mode for reducing the delays between your fingers. Use the delay between blocks to prepare your fingers to type each block in a single beat."},
  { id: "keyboardshot", icon: "⌨", title: "Keyboardshot", header: "React quickly.",
    home: "React quickly to multiple highlighted keys at a time.",
    help: "A fun mode inspired by gridshot from fps games. Use this mode to increase your coordination and dexterity in moving multiple fingers at a time."},
  { id: "workout", icon: "↟", title: "Workout", header: "Workout.",
    home: "Focused bursts to strengthen one finger.",
    help: "A workout mode to train specific fingers. Choose the finger you want to practice in Settings. Letters are generated to focus on the selected finger."},
  { id: "practice", icon: "✦", title: "Practice", header: "Practice.",
    home: "Exercises shaped by your Flow results.",
    help: "A mode for improving your performance on your slowest letters and bigrams, with text tailored to your needs based on analytics collected during Flow sessions. Use this mode to work on weak points."},
];
