import Link from "next/link";
import { SectionCard } from "@/components/SectionCard";

const faqs = [
  { q: "How accurate is the AI analysis?", a: "Our AI achieves 95%+ accuracy in line item extraction and comparison, trained on thousands of insurance estimates." },
  { q: "What file formats do you support?", a: "We support PDF, PNG, and JPG files up to 10MB. Works with Xactimate, Symbility, and handwritten estimates." },
  { q: "How long does processing take?", a: "Most estimates are processed in under 5 minutes. Complex multi-page estimates may take up to 10 minutes." },
  { q: "Is my data secure?", a: "Yes. All files are encrypted in transit and at rest. We use Supabase with row-level security and never share your data." },
  { q: "Can I cancel my subscription?", a: "Yes, cancel anytime from your account page. No questions asked, no cancellation fees." },
  { q: "What's the difference between one-off and subscription?", a: "One-off is $79 for a single review. Pro subscription is $249/month for unlimited reviews with priority processing." },
  { q: "Do you offer refunds?", a: "Yes. If you're not satisfied with your first review, contact us within 7 days for a full refund." },
  { q: "Can I re-run analysis on the same estimate?", a: "Yes. Pro subscribers can re-run analysis anytime. One-off purchases include one analysis per estimate." },
  { q: "What if the AI makes a mistake?", a: "Our AI is highly accurate, but if you find an error, contact support and we'll review it manually at no charge." },
  { q: "Do you integrate with Xactimate or other software?", a: "Currently, you upload PDF exports. Direct integrations are planned for future releases." },
  { q: "Can I white-label the PDF reports?", a: "Pro subscribers can customize PDF reports with their company branding (coming soon)." },
  { q: "What types of estimates work best?", a: "Any insurance estimate works. Best results with clear, typed estimates. Handwritten estimates work but may require review." },
  { q: "Do you support multi-page estimates?", a: "Yes. Upload estimates of any length. Our AI processes all pages automatically." },
  { q: "Can I export data to Excel?", a: "Currently, we provide PDF reports. Excel export is planned for a future update." },
  { q: "How do I contact support?", a: "Email support@estimatereviewpro.com or use the contact form. We respond within 24 hours." },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-xs font-black text-slate-950">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">Estimate Review Pro</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link href="/pricing" className="hover:text-slate-50">Pricing</Link>
            <Link href="/how-it-works" className="hover:text-slate-50">How It Works</Link>
            <Link href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-50">Frequently Asked Questions</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300">Everything you need to know about Estimate Review Pro</p>
        </section>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <SectionCard key={idx} title={faq.q}>
              <p className="text-xs text-slate-300">{faq.a}</p>
            </SectionCard>
          ))}
        </div>

        <section className="text-center">
          <p className="text-sm text-slate-300">Still have questions?</p>
          <Link href="/contact" className="mt-4 inline-block text-sm font-semibold text-amber-300 hover:underline">Contact Support</Link>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-400">
          <p>&copy; 2024 Estimate Review Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

