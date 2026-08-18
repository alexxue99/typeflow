"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpWithEmail } from "./actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, null);
  return <main className="auth-page"><form className="auth-card" action={action}>
    <Link className="auth-brand" href="/">tf <span>typeflow</span></Link>
    <span className="eyebrow">Save your identity</span><h1>Create an account.</h1>
    <label>Name<input name="name" autoComplete="name" required /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button className="primary" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    <p>Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
  </form></main>;
}
