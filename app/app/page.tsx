import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";

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
    redirect("/pricing?message=payment_required");
  }

  const [{ data: reports }, { data: reviews }] = await Promise.all([
    supabase.from("reports").select("id").eq("user_id", user.id).limit(1),
    supabase.from("reviews").select("id").eq("user_id", user.id).limit(1),
  ]);

  if (
    (reports && reports.length > 0) ||
    (reviews && reviews.length > 0)
  ) {
    redirect("/dashboard");
  }

  redirect("/upload");
}
