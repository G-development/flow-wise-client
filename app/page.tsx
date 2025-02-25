"use client";

import {useAuth} from "@/hooks/useAuth";

export default function Home() {
    useAuth();

    return (
        <div className="flex h-screen items-center justify-center">
            <h1 className="text-2xl font-bold">Flow wise ©2025</h1>
        </div>
    );
}
