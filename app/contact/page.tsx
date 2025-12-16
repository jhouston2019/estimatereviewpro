import Link from "next/link";
import { SectionCard } from "@/components/SectionCard";

export default function ContactPage() {
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

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-50">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300">Have a question? We're here to help.</p>
        </section>

        <SectionCard title="Send Us a Message">
          <form action="mailto:support@estimatereviewpro.com" method="GET" className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-200">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-200">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-xs font-medium text-slate-200">Message</label>
              <textarea
                id="message"
                name="body"
                rows={6}
                required
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
            >
              Send Message
            </button>
          </form>
          <div className="mt-6 border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-400">Or email us directly at:</p>
            <a href="mailto:support@estimatereviewpro.com" className="mt-2 block text-sm font-semibold text-amber-300 hover:underline">
              support@estimatereviewpro.com
            </a>
          </div>
        </SectionCard>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-400">
          <p>&copy; 2024 Estimate Review Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

