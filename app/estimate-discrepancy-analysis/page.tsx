import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estimate Discrepancy Analysis | Find Missing Items | Estimate Review Pro",
  description: "Professional analysis of estimate discrepancies. AI-powered identification of missing items, pricing errors, and scope gaps in insurance and contractor estimates.",
};

export default function EstimateDiscrepancyAnalysisPage() {
  return (
    <SeoLandingPage
      title="Estimate Discrepancy Analysis"
      subtitle="AI-Powered Identification of Missing Items and Pricing Errors"
      description="Estimate discrepancies between contractors and insurance carriers can reach tens of thousands of dollars. Our AI performs comprehensive discrepancy analysis, identifying every missing item, pricing difference, and scope gap with detailed documentation to support your negotiation for fair compensation."
      sections={[
        {
          heading: "Types of Estimate Discrepancies",
          body: "Discrepancies between estimates fall into several categories, each requiring different documentation and negotiation approaches:",
          bullets: [
            "Missing line items - work included in one estimate but omitted from another",
            "Quantity discrepancies - different measurements or calculations",
            "Pricing differences - same work priced differently",
            "Material quality differences - specifications for different grade materials",
            "Scope interpretation differences - different understanding of work required",
            "Calculation errors - mathematical mistakes in totals or extensions",
          ],
        },
        {
          heading: "How Our Discrepancy Analysis Works",
          body: "Upload multiple estimates and our AI performs line-by-line comparison, categorizing every discrepancy and providing detailed documentation:",
          bullets: [
            "Extraction of all line items from each estimate",
            "Matching of similar items across different estimates",
            "Identification of items present in one estimate but missing from others",
            "Quantity comparison for matched items",
            "Pricing analysis for matched items",
            "Categorization of discrepancies by type and trade",
            "Professional PDF report with detailed findings",
          ],
        },
        {
          heading: "Using Discrepancy Analysis for Negotiations",
          body: "Our detailed discrepancy reports provide powerful documentation for insurance negotiations:",
          bullets: [
            "Objective third-party analysis of estimate differences",
            "Specific line-item documentation of missing items",
            "Pricing comparisons with regional cost data",
            "Clear categorization making it easy to address each discrepancy",
            "Professional formatting suitable for adjuster review",
            "Supporting data for claim supplements and appeals",
          ],
        },
      ]}
      faqs={[
        {
          question: "Can you analyze discrepancies between multiple contractor estimates?",
          answer: "Yes. Upload multiple contractor estimates plus the insurance estimate for comprehensive comparison showing how each differs and identifying consensus items that should definitely be included.",
        },
        {
          question: "How do you handle estimates in different formats (Xactimate vs contractor software)?",
          answer: "Our AI translates between different estimating formats, matching line items even when described differently and comparing pricing despite different software structures.",
        },
        {
          question: "What if the discrepancy is due to different interpretations of scope?",
          answer: "Our report identifies scope interpretation differences and provides context about why different approaches exist, helping you determine which interpretation is more appropriate for your situation.",
        },
        {
          question: "Can you identify calculation errors in estimates?",
          answer: "Yes. Our AI verifies mathematical calculations including quantity extensions, subtotals, and final totals, flagging any errors that affect the estimate accuracy.",
        },
        {
          question: "How detailed is the discrepancy analysis?",
          answer: "We provide line-by-line analysis showing exactly what's different between estimates, categorized by type of discrepancy (missing, quantity, pricing, etc.) for easy review and action.",
        },
      ]}
      ctaLabel="Analyze Your Estimate Discrepancies"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Estimate Discrepancy Analysis",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered estimate discrepancy analysis identifying missing items, pricing differences, and scope gaps between insurance and contractor estimates.",
      }}
    />
  );
}

