import Link from "next/link";
import { SeoContent } from "@/lib/seo/content";

interface SeoLayoutProps {
  content: SeoContent;
  schemas: {
    service: any;
    faq: any;
    breadcrumb: any;
  };
  children: React.ReactNode;
}

export function SeoLayout({ content, schemas, children }: SeoLayoutProps) {
  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }}
      />

      <div className="flex min-h-screen flex-col bg-slate-950">
        {/* Header */}
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
              <Link href="/pricing" className="hover:text-slate-50">
                Pricing
              </Link>
              <Link href="/how-it-works" className="hover:text-slate-50">
                How It Works
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12">
          {children}

          {/* CTA Block */}
          <section className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-950 p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-50">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300">
              Upload your estimate and get professional AI-powered analysis in
              minutes. No hidden fees, no surprises.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
              >
                View Pricing
              </Link>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-50"
              >
                Start Analysis
              </Link>
            </div>
          </section>

          {/* Related Pages */}
          {content.relatedPages.length > 0 && (
            <section>
              <h2 className="mb-4 text-center text-lg font-semibold text-slate-50">
                Related Services
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {content.relatedPages.slice(0, 6).map((page) => (
                  <Link
                    key={page}
                    href={page}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-200 hover:border-slate-600 hover:text-slate-50"
                  >
                    {formatPageTitle(page)}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-400">
            <p>&copy; 2024 Estimate Review Pro. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function formatPageTitle(path: string): string {
  return path
    .replace(/^\//, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

