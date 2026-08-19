import TypingApp from "./components/TypingApp";
import { getNeonAuth, isNeonAuthConfigured } from "./lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authAvailable = isNeonAuthConfigured();
  const session = authAvailable ? (await getNeonAuth().getSession()).data : null;
  return <TypingApp authAvailable={authAvailable} username={session?.user?.name ?? null} />;
}
