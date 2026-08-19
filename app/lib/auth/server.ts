import { createNeonAuth } from "@neondatabase/auth/next/server";

let authInstance: ReturnType<typeof createNeonAuth> | null = null;

export function isNeonAuthConfigured() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

export function getNeonAuth() {
  if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
    throw new Error("NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required for Neon Auth.");
  }
  authInstance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET },
  });
  return authInstance;
}

export type AuthenticatedUser = { id: string; username: string };

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isNeonAuthConfigured()) return null;
  const session = (await getNeonAuth().getSession()).data;
  const id = session?.user?.id;
  const username = session?.user?.name?.trim();
  if (!id || !username) return null;
  return { id, username };
}

export async function leaderboardPlayerKey(userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`neon:${userId}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
