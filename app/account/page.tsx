import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";

export default async function AccountPage() {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/account");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-xs font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500"
            >
              New review
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <h1 className="text-xl font-semibold text-slate-50">Account</h1>
        <p className="mt-2 text-xs text-slate-400">
          Signed in as{" "}
          <span className="font-medium text-slate-200">{user.email}</span>
        </p>
        <p className="mt-6 text-xs text-slate-500">
          Billing and subscription management use the same secure checkout
          flow from the pricing page. Contact support if you need help with
          your plan.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex rounded-full bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
        >
          View plans
        </Link>
      </main>
    </div>
  );
}
