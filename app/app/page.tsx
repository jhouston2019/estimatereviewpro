import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import type { Database } from "@/lib/supabase-types";

type UserPlanRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "plan_type"
>;

async function recoverVerifyPayment(sessionId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();
  let url: string;
  if (base) {
    url = `${base.replace(/\/$/, "")}/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`;
  } else {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    url = `${proto}://${host}/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`;
  }
  try {
    await fetch(url, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    /* recovery best-effort */
  }
}

type RecoverPaymentState = {
  status: "paid" | "processing" | "none";
  session_id: string | null;
};

async function fetchRecoverPaymentState(): Promise<RecoverPaymentState> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();
  let url: string;
  if (base) {
    url = `${base.replace(/\/$/, "")}/api/recover-payment-state`;
  } else {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    url = `${proto}://${host}/api/recover-payment-state`;
  }
  try {
    const res = await fetch(url, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "none", session_id: null };
    }
    const j = (await res.json()) as {
      status?: string;
      session_id?: string | null;
    };
    if (j.status === "paid") {
      return { status: "paid", session_id: j.session_id ?? null };
    }
    if (j.status === "processing") {
      return { status: "processing", session_id: j.session_id ?? null };
    }
    return { status: "none", session_id: null };
  } catch {
    return { status: "none", session_id: null };
  }
}

export default async function AppEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id?.trim();

  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const from = sessionId
      ? `/app?session_id=${encodeURIComponent(sessionId)}`
      : "/app";
    redirect(`/login?redirectedFrom=${encodeURIComponent(from)}`);
  }

  if (sessionId) {
    await recoverVerifyPayment(sessionId);
  }

  const { data: paid, error: paidErr } = await supabase.rpc(
    "user_has_paid_access"
  );

  if (!paidErr && paid === false) {
    const recovery = await fetchRecoverPaymentState();
    if (recovery.status === "none") {
      redirect("/pricing?message=payment_required");
    }
    if (recovery.status === "processing" && recovery.session_id) {
      await recoverVerifyPayment(recovery.session_id);
    }
    const { data: paidAfterRecovery } = await supabase.rpc(
      "user_has_paid_access"
    );
    if (paidAfterRecovery === false) {
      redirect("/pricing?message=payment_required");
    }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("plan_type")
    .eq("id", user.id)
    .maybeSingle();

  const plan = (userData as UserPlanRow | null)?.plan_type;

  if (plan === "single") {
    redirect("/upload");
  }

  if (plan === "premier" || plan === "enterprise") {
    redirect("/dashboard");
  }

  redirect("/dashboard");
}
