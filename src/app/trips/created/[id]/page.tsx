"use client";

import { Button, Screen } from "@/components/ui";
import { useParams, useRouter } from "next/navigation";

export default function TripCreatedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  return (
    <Screen className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-lg rounded-[32px] border border-line bg-white/70 p-8 text-center shadow-[var(--shadow)]">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl">
          YOU CREATED A TRIP!
        </h1>
        <div className="mt-8 grid gap-3">
          <Button onClick={() => router.push(`/trips/${params.id}/bus-plan`)}>
            Open bus plan
          </Button>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Back
          </Button>
        </div>
      </div>
    </Screen>
  );
}
