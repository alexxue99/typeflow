"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { signInWithEmail } from "../../auth/sign-in/actions";
import { signUpWithEmail } from "../../auth/sign-up/actions";

type AuthFormProps = {
  onHome: () => void;
  onSwitch: () => void;
  onSuccess: () => void;
};

export function SignInForm({ onHome, onSwitch, onSuccess }: AuthFormProps) {
  const [state, action, pending] = useActionState(signInWithEmail, null);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return <form className="auth-card" action={action}>
    <button className="auth-brand" type="button" onClick={onHome}>tf</button>
    <span className="eyebrow">Welcome back</span>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button className="primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    <p>New to typeflow? <button className="auth-text-button" type="button" onClick={onSwitch}>Create an account</button></p>
  </form>;
}

export function SignUpForm({ onHome, onSwitch, onSuccess }: AuthFormProps) {
  const [state, action, pending] = useActionState(signUpWithEmail, null);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return <form className="auth-card" action={action}>
    <button className="auth-brand" type="button" onClick={onHome}>tf</button>
    <span className="eyebrow">Create an account</span>
    <label>Username<input name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button className="primary" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    <p>Already have an account? <button className="auth-text-button" type="button" onClick={onSwitch}>Sign in</button></p>
  </form>;
}
