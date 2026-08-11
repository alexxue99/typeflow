# Typeflow

Typeflow is a typing practice website for practicing smooth, relaxed typing. It offers several ways to build rhythm, accuracy, finger independence, and keyboard awareness.

All settings and typing analytics stay in the user's browser.

## Features

- Six practice modes:
  - **Flow** generates real words while separating repeated uses of the same finger.
  - **Zen** generates focused blocks of random letters.
  - **Freedom** lets you clear each letter block in any order.
  - **Keyboardshot** turns highlighted keys into a reaction and accuracy game.
  - **Workout** concentrates practice on a selected finger.
  - **Practice** uses Flow analytics to emphasize difficult letters and bigrams.
- Timed, fixed-length, and endless sessions.
- Live WPM, accuracy, elapsed time, character count, and progress metrics.
- Configurable finger-to-key mapping and minimum finger gap.
- Adjustable typography, caret behavior, reset hotkey, and reduced motion.
- Light, dark, paper, forest, ocean, lavender, and high-contrast themes.
- Optional standard English letter-frequency weighting and Keyboardshot sounds.
- Local analytics for recent Flow sessions, error-prone letters, and slow bigrams.
- Responsive, keyboard-accessible interface.

## Privacy and data

Typeflow does not require an account. Settings and analytics are saved to browser `localStorage`; they are not sent to a server. Clearing site data or using another browser or device will start with a fresh profile.

Only Flow sessions contribute to personalized analytics. Other modes remain separate from progress tracking.

## Getting started

### Requirements

- Node.js 22.13 or newer
- pnpm

### Run locally

```bash
pnpm install
pnpm dev
```

Open the local address printed by the development server.

### Validate a change

```bash
pnpm test
pnpm lint
pnpm build
```

The test suite covers typing behavior, exercise generation, analytics, Freedom mode, and Keyboardshot.

## Project structure

```text
app/
  components/       App shell and typing-mode interfaces
  lib/              Exercise generation, analytics, storage, and shared logic
  globals.css       Themes, layout, and responsive styles
tests/               Unit and behavior tests
.openai/hosting.json Sites hosting configuration
```

## Technology

Typeflow is built with React, TypeScript, Next.js-compatible app components, vinext, Vite, and Tailwind CSS. The production output is designed for Cloudflare Workers through OpenAI Sites.

## Current version

Version 0.1.0
