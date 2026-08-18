"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "../../lib/auth/server";

export async function signInWithEmail(_previous: { error: string } | null, formData: FormData) {
  const { error } = await getNeonAuth().signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message || "Sign in failed." };
  redirect("/");
}
