import Link from "next/link";
import { AnalysisPreviewClient } from "./AnalysisPreviewClient";

export const metadata = {
  title: "Free estimate preview | Estimate Review Pro",
  description:
    "Upload your carrier estimate for a free preview. Full analysis unlocks after payment.",
};

export default function AnalysisPreviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A]">
      <header className="border-b border-slate-800/50 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-white">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
            <Link
              href="/pricing"
              className="text-slate-200 transition hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <AnalysisPreviewClient />
      </main>
    </div>
  );
}
