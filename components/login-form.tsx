"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  interface FormData {
    email: string;
    password: string;
  }

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", (error as Error).message);
      toast.error("Something went wrong. Try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  onChange={handleChange}
                  value={formData.email}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
                <a
                  href="#"
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  onChange={handleChange}
                  value={formData.password}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground space-y-1">
        <p>
          By signing in, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
