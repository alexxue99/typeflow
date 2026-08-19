# typeflow

typeflow is a typing practice website for practicing smooth, relaxed typing. It offers several ways to build rhythm, accuracy, finger independence, and keyboard awareness.

Settings and typing analytics stay in the user's browser. Authenticated leaderboard scores and user bests are stored in Postgres.

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
- Email/password accounts powered by Neon Auth.
- Shared username-based top-10 leaderboards for Flow, Zen, Freedom, and Keyboardshot; only signed-in users can save scores.
- A User stats page with the signed-in user's best result for every mode and competitive setting combination.
- Responsive, keyboard-accessible interface.

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

### Leaderboard database

Connect a Neon Postgres database to the Vercel project and expose its pooled connection string as `DATABASE_URL`. Use `DATABASE_URL_UNPOOLED` for Drizzle migrations. For local development, `neon env pull` writes the linked branch's managed variables to `.env.local`; `.env.example` documents only the variables this app reads. Apply the SQL migration stored in `drizzle/` before using the leaderboard.

Enable Neon Auth by setting `NEON_AUTH_BASE_URL` from Neon and creating a private `NEON_AUTH_COOKIE_SECRET` of at least 32 characters in both `.env.local` and Vercel. Without those two values, account controls are hidden and scores cannot be saved. Leaderboards remain publicly readable.

## Project structure

```text
app/
  components/       App shell and typing-mode interfaces
  lib/              Exercise generation, analytics, storage, and shared logic
  globals.css       Themes, layout, and responsive styles
tests/               Unit and behavior tests
```

## Current version

Version 0.2.0
