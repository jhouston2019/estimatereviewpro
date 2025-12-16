import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estimate Comparison Tool | Compare Insurance & Contractor Estimates | Estimate Review Pro",
  description: "AI-powered estimate comparison tool. Compare insurance and contractor estimates side-by-side to identify discrepancies and maximize your claim settlement.",
};

export default function EstimateComparisonToolPage() {
  return (
    <SeoLandingPage
      title="Estimate Comparison Tool"
      subtitle="AI-Powered Side-by-Side Analysis of Multiple Estimates"
      description="Comparing insurance and contractor estimates manually is time-consuming and error-prone. Our AI comparison tool performs instant line-by-line analysis of multiple estimates, identifying every discrepancy, missing item, and pricing difference with detailed documentation to support your negotiation for fair compensation."
      sections={[
        {
          heading: "Why You Need an Estimate Comparison Tool",
          body: "Manual estimate comparison is challenging even for professionals. Our AI tool provides capabilities that would take hours manually:",
          bullets: [
            "Instant extraction of all line items from multiple estimates",
            "Automatic matching of similar items across different formats",
            "Identification of items present in one estimate but missing from others",
            "Quantity comparison showing measurement discrepancies",
            "Pricing analysis for matched items",
            "Categorization of discrepancies by type and severity",
            "Professional reporting suitable for insurance submission",
          ],
        },
        {
          heading: "How Our Comparison Tool Works",
          body: "Upload multiple estimates and our AI performs comprehensive comparison analysis:",
          bullets: [
            "Extracts all line items from each estimate regardless of format",
            "Translates between different estimating software (Xactimate, contractor software, etc.)",
            "Matches similar items even when described differently",
            "Identifies items unique to each estimate",
            "Compares quantities for matched items",
            "Analyzes pricing differences for matched items",
            "Generates side-by-side comparison report with detailed findings",
          ],
        },
        {
          heading: "Use Cases for Estimate Comparison",
          body: "Our comparison tool serves multiple purposes throughout the claims process:",
          bullets: [
            "Compare insurance estimate to contractor quotes before hiring",
            "Document discrepancies for supplement requests",
            "Verify multiple contractor bids are comparable in scope",
            "Support appraisal process with objective third-party analysis",
            "Provide public adjuster with detailed starting point",
            "Document basis for bad faith claims if discrepancies are extreme",
            "Educate yourself about what should be included in estimates",
          ],
        },
        {
          heading: "What You Receive",
          body: "Every estimate comparison includes comprehensive documentation:",
          bullets: [
            "Side-by-side line item comparison of all estimates",
            "Missing items report showing what's in one estimate but not others",
            "Quantity discrepancy analysis with measurement differences",
            "Pricing comparison for matched items",
            "Summary of total differences between estimates",
            "Categorization of discrepancies by trade and type",
            "Professional PDF report suitable for insurance submission",
            "Recommended next steps based on findings",
          ],
        },
      ]}
      faqs={[
        {
          question: "Can your tool compare estimates in different formats?",
          answer: "Yes. Our AI translates between Xactimate, contractor software, handwritten estimates, and other formats, matching line items even when described differently.",
        },
        {
          question: "How many estimates can I compare at once?",
          answer: "You can compare unlimited estimates in a single analysis. Upload the insurance estimate plus multiple contractor quotes for comprehensive comparison.",
        },
        {
          question: "What if estimates use different units of measure?",
          answer: "Our AI converts between units of measure (SF to SQ, LF to EA, etc.) to enable accurate quantity comparison across different estimating approaches.",
        },
        {
          question: "Can the tool identify which estimate is most accurate?",
          answer: "We don't declare one estimate 'right' or 'wrong.' Instead, we document specific discrepancies in scope, quantities, and pricing, allowing you to make informed decisions.",
        },
        {
          question: "How long does estimate comparison take?",
          answer: "Most comparisons are completed in under 5 minutes regardless of how many estimates you upload or how complex they are.",
        },
        {
          question: "Can I use the comparison report in negotiations?",
          answer: "Yes. Our reports provide objective, detailed documentation of discrepancies that insurance adjusters can verify, making them powerful negotiation tools.",
        },
        {
          question: "What if I only have one estimate to review?",
          answer: "Our platform also performs single estimate analysis, comparing against industry standards and comprehensive scope checklists to identify missing items and pricing issues.",
        },
        {
          question: "Do you store my estimates after comparison?",
          answer: "Estimates are stored securely in your account with bank-level encryption. You can access past comparisons anytime, and we never share your data with third parties.",
        },
      ]}
      ctaLabel="Compare Your Estimates Now"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Estimate Comparison Tool",
        "applicationCategory": "BusinessApplication",
        "description": "AI-powered estimate comparison tool for side-by-side analysis of insurance and contractor property damage estimates.",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "offers": {
          "@type": "Offer",
          "price": "79",
          "priceCurrency": "USD",
        },
      }}
    />
  );
}

