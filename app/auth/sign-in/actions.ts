"use server";

import { getNeonAuth } from "../../lib/auth/server";

export type AuthActionState = { error?: string; success?: boolean } | null;

export async function signInWithEmail(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const { error } = await getNeonAuth().signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message || "Sign in failed." };
  return { success: true };
}
