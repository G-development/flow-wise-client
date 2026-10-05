"use client";
import { useAuth } from "@/lib/providers/AuthProvider";

export default function Home() {
  const { isLoading } = useAuth();

  // AuthProvider handles all redirects, just show a loading screen
  return (
    <div className="flex h-screen items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <h1 className="text-2xl font-bold">Flow wise ©2025</h1>
        </div>
      ) : (
        <h1 className="text-2xl font-bold">Flow wise ©2025</h1>
      )}
    </div>
  );
}
