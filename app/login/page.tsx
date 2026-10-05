"use client";

import Image from "next/image";
import Logo from "../flow-wise-logo.svg";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-shell flex min-h-svh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5">
            <Image src={Logo} width={40} height={40} alt="Flow Wise logo" priority />
            <span className="text-lg font-semibold tracking-tight">Flow Wise</span>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your Flow Wise account</p>
          </div>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign up here
          </Link>
        </div>
      </div>
    </main>
  );
}
