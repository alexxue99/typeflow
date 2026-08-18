"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signInWithEmail, null);
  return <main className="auth-page"><form className="auth-card" action={action}>
    <Link className="auth-brand" href="/">tf <span>typeflow</span></Link>
    <span className="eyebrow">Welcome back</span><h1>Sign in.</h1>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button className="primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    <p>New to typeflow? <Link href="/auth/sign-up">Create an account</Link></p>
  </form></main>;
}
