"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, CircleAlert, Eye, EyeOff, Lock } from "lucide-react";
import { AuthError, AuthShell, AuthStatusIcon } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// 13/11/2026: stessa grafica del login (AuthShell); la logica (verifica del token, forza della
// password, invio) e' quella di prima.

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  // Valida il token all'avvio
  useEffect(() => {
    if (!token || !emailParam) {
      setError("Invalid reset link");
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5030"}/auth/verify-reset-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired reset link");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        setError("Failed to validate reset link");
        console.error(err);
      } finally {
        setValidating(false);
      }
    };

    void validateToken();
  }, [token, emailParam]);

  // Calcola la forza della password
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Lunghezza minima
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;

    // Maiuscole
    if (/[A-Z]/.test(password)) strength += 15;

    // Numeri
    if (/\d/.test(password)) strength += 15;

    // Caratteri speciali
    if (/[@$!%*?&]/.test(password)) strength += 20;

    setPasswordStrength(Math.min(100, strength));
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return "bg-destructive";
    if (passwordStrength < 60) return "bg-warning";
    return "bg-success";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Fair";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordStrength < 50) {
      setError("Password is not strong enough");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5030"}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            email: emailParam,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link href="/login" className="font-semibold text-primary hover:underline">
      Back to login
    </Link>
  );

  if (validating) {
    return <ValidatingLink />;
  }

  if (!tokenValid) {
    return (
      <AuthShell title="Invalid link" footer={backToLogin}>
        <div className="space-y-4 text-center">
          <AuthStatusIcon tone="error">
            <CircleAlert className="h-7 w-7" />
          </AuthStatusIcon>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/forgot-password" className="inline-block font-semibold text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Password updated">
        <div className="space-y-4 text-center">
          <AuthStatusIcon tone="success">
            <Check className="h-7 w-7" />
          </AuthStatusIcon>
          <p className="text-muted-foreground">
            Your password has been reset. You will be taken to the login page in a moment.
          </p>
          <Link href="/login" className="inline-block font-semibold text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  const matches = password === confirmPassword;

  return (
    <AuthShell
      title="Reset password"
      description="Choose a new password for your Flow Wise account."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={setPassword}
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          placeholder="Enter new password"
          disabled={loading}
        >
          {password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span
                  className={cn(
                    "font-medium",
                    passwordStrength < 30 ? "text-destructive" : passwordStrength < 60 ? "text-warning" : "text-success"
                  )}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full transition-all", getPasswordStrengthColor())}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            At least 8 characters, with an uppercase letter, a number and a special character (@$!%*?&amp;).
          </p>
        </PasswordField>

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm password"
          disabled={loading}
        >
          {confirmPassword && (
            <p className={cn("flex items-center gap-1 text-xs", matches ? "text-success" : "text-destructive")}>
              {matches ? <Check className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
              {matches ? "Passwords match" : "Passwords don't match"}
            </p>
          )}
        </PasswordField>

        {error && <AuthError>{error}</AuthError>}

        <Button
          type="submit"
          className="w-full h-11 font-semibold"
          disabled={loading || !password || !confirmPassword || !matches || passwordStrength < 50}
        >
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
  disabled: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <div className="relative group">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          disabled={disabled}
          className="pl-10 pr-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}

function ValidatingLink() {
  return (
    <main className="auth-shell flex min-h-svh items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-muted-foreground">Validating reset link…</p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ValidatingLink />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
