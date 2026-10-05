import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Lock } from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created! Redirecting to login...");
        router.replace("/login");
      } else {
        toast.error(data.msg || data.error || "Authentication error");
      }
    } catch {
      toast.error("Registration error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/70 bg-card/90 shadow-lg shadow-foreground/[0.04]">
        <CardContent className="pt-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="john_doe"
                  className="h-11 pl-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20"
                  onChange={handleChange}
                  value={formData.name}
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 pl-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20"
                  onChange={handleChange}
                  value={formData.email}
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 pl-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20"
                  onChange={handleChange}
                  value={formData.password}
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 pl-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20"
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground space-y-2">
        <p>
          By signing up, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
