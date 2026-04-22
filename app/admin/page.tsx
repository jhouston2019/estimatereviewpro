import Link from "next/link";
import { assertAdminOrRedirectToLogin } from "@/lib/auth/assertAdminServer";
import { loadAdminDashboardData } from "@/lib/admin/adminData";
import { AccountSignOutButton } from "@/app/account/AccountSignOutButton";

export default async function AdminPage() {
  await assertAdminOrRedirectToLogin();

  const data = await loadAdminDashboardData();

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
          <AccountSignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 text-slate-200">
        <h1 className="text-xl font-semibold text-slate-50">Admin</h1>
        {data.error ? (
          <p className="mt-4 text-sm text-rose-300" role="alert">
            {data.error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-[11px] font-medium text-slate-500">Total users</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {data.totalUsers}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-[11px] font-medium text-slate-500">
              Total reviews
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {data.totalReviews}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-[11px] font-medium text-slate-500">
              Active subscriptions
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {data.activeSubscriptions}
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
          All users
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-500">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Billing</th>
                <th className="px-3 py-2 font-medium">Reviews used</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800/80 last:border-0"
                >
                  <td className="px-3 py-2 text-slate-200">{u.email}</td>
                  <td className="px-3 py-2 capitalize text-slate-300">
                    {u.planType ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {u.billingStatus}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {u.reviewsUsed ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
          All reviews
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] text-slate-500">
                <th className="px-3 py-2 font-medium">Insured</th>
                <th className="px-3 py-2 font-medium">User email</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Claim #</th>
              </tr>
            </thead>
            <tbody>
              {data.reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-800/80 last:border-0"
                >
                  <td className="px-3 py-2 text-slate-200">
                    {r.insuredName ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{r.userEmail}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {r.claimNumber ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
