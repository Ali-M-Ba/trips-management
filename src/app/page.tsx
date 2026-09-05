"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        router.replace(data.user ? "/dashboard" : "/login");
      } catch {
        router.replace("/login");
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink text-paper">
      <div className="flex h-28 w-28 items-center justify-center rounded-[36px] border border-[#e8c37a] bg-[#1b2738]">
        <svg viewBox="0 0 64 64" className="h-16 w-16 animate-spin" aria-hidden>
          <circle
            cx="32"
            cy="32"
            r="22"
            fill="none"
            stroke="#e8c37a"
            strokeWidth="5"
            strokeDasharray="40 80"
          />
        </svg>
      </div>
      <p className="mt-8 font-[family-name:var(--font-fraunces)] text-3xl">Trip Sheets</p>
      <p className="mt-2 text-sm uppercase tracking-[0.28em] text-[#e8c37a]">
        Loading bus plan
      </p>
    </div>
  );
}
