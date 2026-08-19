"use server";

import { getNeonAuth } from "../../lib/auth/server";
import { isUsernameAvailable } from "../../lib/auth/usernames";
import type { AuthActionState } from "../sign-in/actions";

export async function signUpWithEmail(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "").trim();
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    return { error: "Username must be 3–24 characters using letters, numbers, or underscores." };
  }
  if (!await isUsernameAvailable(username)) {
    return { error: "That username is already in use." };
  }
  const { error } = await getNeonAuth().signUp.email({
    name: username,
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message || "Account creation failed." };
  return { success: true };
}
