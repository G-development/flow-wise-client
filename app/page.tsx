"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("fw-token");

    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Flow wise ©2025</h1>
    </div>
  );
}
