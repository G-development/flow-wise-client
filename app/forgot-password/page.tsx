"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { AuthError, AuthShell, AuthStatusIcon } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/lib/constants";

// 13/11/2026: stessa grafica del login (AuthShell); la logica e' quella di prima.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL || "http://localhost:5030"}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <>
      Remember your password?{" "}
      <Link href="/login" className="font-semibold text-primary hover:underline">
        Back to login
      </Link>
    </>
  );

  if (success) {
    return (
      <AuthShell title="Check your email" footer={backToLogin}>
        <div className="space-y-4 text-center">
          <AuthStatusIcon tone="success">
            <Check className="h-7 w-7" />
          </AuthStatusIcon>
          <p className="text-muted-foreground">
            We&apos;ve sent a password reset link to your email address. Click the link in the email to
            choose a new password.
          </p>
          <p className="text-sm text-muted-foreground">The link expires in 1 hour.</p>
          <div className="space-y-1 pt-2 text-sm">
            <p className="text-muted-foreground">Didn&apos;t receive the email?</p>
            <Button
              variant="link"
              className="h-auto p-0 font-semibold"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password?"
      description="Enter your email and we'll send you a link to reset your password."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {error && <AuthError>{error}</AuthError>}

        <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || !email}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
