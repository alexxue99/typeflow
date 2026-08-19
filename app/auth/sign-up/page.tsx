"use client";

import { useRouter } from "next/navigation";
import { SignUpForm } from "../../components/auth/AuthForms";

export default function SignUpPage() {
  const router = useRouter();
  return <main className="auth-page"><SignUpForm
    onHome={() => router.push("/")}
    onSwitch={() => router.push("/auth/sign-in")}
    onSuccess={() => router.replace("/")}
  /></main>;
}
