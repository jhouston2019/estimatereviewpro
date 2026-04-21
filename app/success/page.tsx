"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const sid = params?.get("session_id");

    if (!sid) {
      router.replace("/pricing");
      return;
    }

    fetch("/api/auth/create-session-from-stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sid }),
    }).finally(() => {
      router.replace("/app");
    });
  }, [router, params]);

  return <div>Finishing up…</div>;
}
