import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { CheckoutButton } from "./CheckoutButton";
import { PortalButton } from "./PortalButton";
import { SectionCard } from "@/components/SectionCard";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AccountPage() {
  const supabase = await createServerClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fully typed profile fetch
  const profile = await getProfile(user.id);

  const tier = profile?.tier ?? "free";
  const subscriptionStatus = profile?.subscription_status ?? "none";
  const stripeCustomerId = profile?.stripe_customer_id;

  // Enforce subscription for account page access
  if (tier === "free") {
    redirect("/pricing?upgrade=required");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-xs font-black text-slate-950">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-slate-50"
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className="rounded-full bg-slate-900 px-3 py-1.5 text-amber-300"
            >
              Account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            Subscription & Billing
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Manage your plan, billing, and payment methods
          </p>
        </section>

        {/* Subscription Overview */}
        <SectionCard title="Current Plan">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-slate-50">
                  {tier === "pro"
                    ? "Unlimited Monthly"
                    : tier === "oneoff"
                    ? "One-Time Review"
                    : "Free Plan"}
                </p>
                <StatusBadge status={subscriptionStatus} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {tier === "pro"
                  ? "$249/month - Unlimited reviews"
                  : tier === "oneoff"
                  ? "$79 - Single review purchased"
                  : "No active subscription"}
              </p>
            </div>
            <div>
              {tier === "pro" && stripeCustomerId && (
                <PortalButton userId={user.id} />
              )}
            </div>
          </div>
        </SectionCard>

        {/* Upgrade Options */}
        {tier !== "pro" && (
          <section className="grid gap-6 md:grid-cols-2">
            <SectionCard title="$79 One-Time Review">
              <p className="mt-2 text-xs text-slate-300">
                Perfect for a single estimate analysis
              </p>
              <p className="mt-4 text-2xl font-semibold text-slate-50">$79</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-200">
                <li>✓ Full AI analysis</li>
                <li>✓ PDF report included</li>
                <li>✓ Stored in dashboard</li>
              </ul>
              <div className="mt-6">
                <CheckoutButton userId={user.id} priceType="oneoff" />
              </div>
            </SectionCard>

            <SectionCard title="$249/mo Unlimited" variant="success">
              <div className="flex items-start justify-between">
                <p className="mt-2 text-xs text-slate-100">
                  For professionals running multiple claims
                </p>
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-950">
                  Best Value
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-50">$249</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-100">
                <li>✓ Unlimited reviews</li>
                <li>✓ Priority processing</li>
                <li>✓ White-label PDFs</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <div className="mt-6">
                <CheckoutButton userId={user.id} priceType="pro" />
              </div>
            </SectionCard>
          </section>
        )}

        {/* Billing Settings */}
        {tier === "pro" && stripeCustomerId && (
          <SectionCard title="Billing Settings">
            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="text-slate-200">Managed via Stripe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Cycle</span>
                <span className="text-slate-200">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Billing Date</span>
                <span className="text-slate-200">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <PortalButton userId={user.id} />
            </div>
          </SectionCard>
        )}

        {/* Account Details */}
        <SectionCard title="Account Details">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-200">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-[10px] text-slate-500">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Created</span>
              <span className="text-slate-200">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Sign Out */}
        <section>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-slate-200 hover:underline hover:underline-offset-4"
            >
              Sign out
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
