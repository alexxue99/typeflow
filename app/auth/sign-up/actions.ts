"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "../../lib/auth/server";

export async function signUpWithEmail(_previous: { error: string } | null, formData: FormData) {
  const { error } = await getNeonAuth().signUp.email({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message || "Account creation failed." };
  redirect("/");
}
