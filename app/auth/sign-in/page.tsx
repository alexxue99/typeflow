"use client";

import { useRouter } from "next/navigation";
import { SignInForm } from "../../components/auth/AuthForms";

export default function SignInPage() {
  const router = useRouter();
  return <main className="auth-page"><SignInForm
    onHome={() => router.push("/")}
    onSwitch={() => router.push("/auth/sign-up")}
    onSuccess={() => router.replace("/")}
  /></main>;
}
