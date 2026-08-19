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

## Technology stack

- **Framework:** Next.js 16 with the App Router
- **UI:** React 19, TypeScript, and Tailwind CSS 4
- **Database:** Neon Postgres using the Neon serverless driver
- **Authentication:** Neon Auth
- **Data access and migrations:** Drizzle ORM and Drizzle Kit
- **Testing and code quality:** Vitest and ESLint
- **Package management:** pnpm

## Current version

Version 0.2.2
