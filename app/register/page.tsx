"use client";

import Image from "next/image";
import Logo from "../flow-wise-logo.svg";
import { RegisterForm } from "@/components/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-shell flex min-h-svh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5">
            <Image src={Logo} width={40} height={40} alt="Flow Wise logo" priority />
            <span className="text-lg font-semibold tracking-tight">Flow Wise</span>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Join Flow Wise</h1>
            <p className="mt-2 text-muted-foreground">Create your account to start managing your finances</p>
          </div>
        </div>

        <RegisterForm />

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </main>
  );
}
