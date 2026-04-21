"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionId: string | null;
};

export function SuccessRedirect({ sessionId }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    fetch("/api/auth/create-session-from-stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId }),
    }).finally(() => {
      router.replace("/create-account?session_id=" + encodeURIComponent(sessionId));
    });
  }, [router, sessionId]);

  return <div>Finishing up…</div>;
}
