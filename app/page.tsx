"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Flow wise ©2025</h1>
    </div>
  );
}
