export function PrivacyPage({ onHome }: { onHome: () => void }) {
  return (
    <section className="privacy-page">
      <span className="eyebrow">Your data</span>
      <h1>Privacy Policy</h1>
      <p className="privacy-updated">Last updated August 29, 2026</p>

      <p>
        typeflow is designed to keep your typing practice private by default. Most practice data stays in your browser. Account and leaderboard features are optional and use Neon services when you sign in.
      </p>

      <h2>Information stored on your device</h2>
      <p>typeflow uses your browser&apos;s localStorage for:</p>
      <ul>
        <li><strong>Settings</strong>, including your theme, keyboard and finger mappings, session preferences, accessibility choices, and typing-test display options.</li>
        <li><strong>Typing analytics</strong>, including per-letter and bigram attempts, accuracy and timing data, and recent session results such as date, mode, speed, accuracy, and character count.</li>
      </ul>
      <p>
        This information remains on your device and is not attached to your typeflow account or sent to the typeflow database. You can remove it with typeflow&apos;s reset controls or by clearing this site&apos;s data in your browser. Clearing it may reset your preferences and local analytics.
      </p>

      <h2>Account and authentication data</h2>
      <p>
        If you create an account, Neon Auth processes the username, email address, and password you submit. Passwords are handled by the authentication service rather than stored in localStorage. Neon Auth also maintains account and session records and uses essential cookies to keep you signed in and protect authenticated requests.
      </p>

      <h2>Leaderboard and user-stat data</h2>
      <p>
        When you complete an eligible session while signed in, typeflow may store your username, practice mode and configuration, score, accuracy, elapsed time, and record timestamps in Neon Postgres. A one-way hash derived from your Neon user ID links those results to your account without placing the account ID in the leaderboard table.
      </p>
      <p>
        Your username and qualifying results may appear publicly in a top-ten leaderboard. Your full set of saved personal bests is returned only to you while you are signed in. Local typing analytics, typed text, and individual keystrokes are not uploaded as part of leaderboard submissions.
      </p>

      <h2>Site analytics</h2>
      <p>
        typeflow uses Vercel Web Analytics to understand general site usage and improve the service. Vercel may process page-view and request information, such as the page visited and basic browser, device, referrer, and approximate location data. This is separate from the detailed typing analytics kept in localStorage.
      </p>

      <h2>How information is used and shared</h2>
      <p>Information is used to:</p>
      <ul>
        <li>provide accounts, sign-in sessions, leaderboards, and personal bests;</li>
        <li>remember your preferences and show local practice insights;</li>
        <li>operate, secure, troubleshoot, and improve typeflow; and</li>
        <li>comply with legal obligations and respond to misuse.</li>
      </ul>
      <p>
        typeflow does not sell your personal information. Information is shared with Neon for authentication and database hosting and with Vercel for hosting-related analytics, as needed to provide those services. It may also be disclosed when required by law or necessary to protect the service and its users.
      </p>

      <h2>Retention and your choices</h2>
      <p>
        Local data remains until you reset it or clear the site&apos;s browser storage. Authentication records and saved leaderboard results may remain while your account is active and for as long as needed to operate, secure, and comply with legal obligations. You may use typeflow without an account; in that case, eligible scores are not saved to the shared leaderboard.
      </p>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or restrict the use of your personal information. Use the support or operator contact provided with the typeflow deployment you use to make a privacy request. The operator may need to verify your account before completing it.
      </p>

      <h2>Security, children, and changes</h2>
      <p>
        Reasonable safeguards are used to protect account and leaderboard information, but no online service can guarantee absolute security. typeflow is not directed to children under 13, and users who are not old enough to consent to data processing in their country should use it only with a parent or guardian&apos;s permission.
      </p>
      <p>
        This policy may change as typeflow evolves. Material updates will be reflected on this page by changing the date above.
      </p>

      <p><button className="privacy-home" type="button" onClick={onHome}>Return to typeflow</button></p>
    </section>
  );
}
