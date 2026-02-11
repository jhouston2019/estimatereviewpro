import React from "react";
import Link from "next/link";

interface SeoSection {
  heading: string;
  body: string;
}

interface SeoFaq {
  question: string;
  answer: string;
}

interface SeoLandingPageProps {
  title: string;
  subtitle: string;
  description: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  ctaLabel: string;
  ctaHref: string;
  schema?: Record<string, any>;
}

export function SeoLandingPage({
  title,
  subtitle,
  description,
  sections,
  faqs,
  ctaLabel,
  ctaHref,
  schema,
}: SeoLandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema.org JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-[#1e3a8a] hover:text-[#1e40af] font-semibold">
            ← Estimate Review Pro
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100">{subtitle}</p>
          <p className="text-lg mb-8 text-gray-50">{description}</p>
          <Link
            href={ctaHref}
            className="inline-block bg-white text-[#1e3a8a] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>

      {/* Content Sections */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {sections.map((section, index) => (
          <div key={index} className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {section.heading}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {section.body}
            </p>
          </div>
        ))}
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="bg-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-[#1e3a8a] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-gray-100">
            Upload your estimate and receive a comprehensive analysis in minutes.
          </p>
          <Link
            href={ctaHref}
            className="inline-block bg-white text-[#1e3a8a] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-semibold">Important Limitations:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                This is an automated, observational estimate analysis. No coverage,
                pricing, or entitlement determinations are made.
              </li>
              <li>
                This service does NOT provide legal advice, claim negotiation, or
                coverage interpretation.
              </li>
              <li>
                Results are for informational purposes only and do not guarantee
                any specific outcome or payment.
              </li>
              <li>
                This is NOT a substitute for professional legal counsel or licensed
                public adjuster services.
              </li>
              <li>
                By using this service, you acknowledge these limitations and agree
                that findings are observational only.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Estimate Review Pro. All rights reserved.
          </p>
          <div className="mt-4 space-x-4">
            <Link href="/pricing" className="text-gray-400 hover:text-white">
              Pricing
            </Link>
            <Link href="/" className="text-gray-400 hover:text-white">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

