"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/register", "/privacy"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isLoading: true,
    isAuthenticated: false,
    session: null,
    user: null,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setState({
          isLoading: false,
          isAuthenticated: !!session,
          session,
          user: session?.user || null,
        });

        // Handle redirects after auth check
        if (!session && !PUBLIC_ROUTES.includes(pathname) && pathname !== "/") {
          router.replace("/login");
        } else if (session && (pathname === "/login" || pathname === "/register")) {
          router.replace("/dashboard");
        } else if (session && pathname === "/") {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) {
          setState({
            isLoading: false,
            isAuthenticated: false,
            session: null,
            user: null,
          });
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setState({
          isLoading: false,
          isAuthenticated: !!session,
          session,
          user: session?.user || null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
