import Link from "next/link";
import { SectionCard } from "./SectionCard";

interface SeoLandingPageProps {
  title: string;
  subtitle: string;
  description: string;
  heroImage?: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
  faqs: { question: string; answer: string }[];
  ctaLabel?: string;
  ctaHref?: string;
  schema: any;
}

export function SeoLandingPage({
  title,
  subtitle,
  description,
  heroImage,
  sections,
  faqs,
  ctaLabel = "Get an Estimate Review",
  ctaHref = "/pricing",
  schema,
}: SeoLandingPageProps) {
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12">
          {/* Hero Section */}
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-50 md:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              {subtitle}
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
              {description}
            </p>
            <div className="mt-8">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
              >
                {ctaLabel}
              </Link>
            </div>
          </section>

          {/* Content Sections */}
          {sections.map((section, idx) => (
            <SectionCard key={idx} title={section.heading}>
              <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                <p>{section.body}</p>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2 pl-5">
                    {section.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="list-disc">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          ))}

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <section>
              <h2 className="mb-6 text-center text-2xl font-bold text-slate-50">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <SectionCard key={idx} title={faq.question}>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {faq.answer}
                    </p>
                  </SectionCard>
                ))}
              </div>
            </section>
          )}

          {/* Final CTA */}
          <section className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-slate-950 p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-50">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300">
              Upload your estimates and get a professional AI-powered analysis in
              minutes. No hidden fees, no surprises.
            </p>
            <Link
              href={ctaHref}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
            >
              {ctaLabel}
            </Link>
          </section>
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

