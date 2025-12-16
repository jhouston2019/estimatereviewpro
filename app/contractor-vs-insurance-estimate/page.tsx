import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractor vs Insurance Estimate Comparison | Estimate Review Pro",
  description: "Compare contractor and insurance estimates side-by-side. AI-powered analysis identifies discrepancies, missing items, and pricing differences to maximize your claim settlement.",
};

export default function ContractorVsInsuranceEstimatePage() {
  return (
    <SeoLandingPage
      title="Contractor vs Insurance Estimate Comparison"
      subtitle="Side-by-Side Analysis to Identify Discrepancies and Maximize Your Settlement"
      description="When your contractor's estimate is significantly higher than your insurance carrier's estimate, you need objective analysis to understand why. Our AI performs line-by-line comparison of both estimates, identifying missing items, pricing discrepancies, and scope differences that explain the gap and support your negotiation for fair compensation."
      sections={[
        {
          heading: "Why Contractor and Insurance Estimates Differ",
          body: "It's extremely common for contractor estimates to exceed insurance estimates by 20-50% or more. These differences aren't necessarily because one party is wrong—they often reflect different perspectives, priorities, and constraints in the estimating process.",
          bullets: [
            "Contractors see actual conditions during site visits; adjusters often estimate from photos",
            "Contractors include all work needed for quality repairs; carriers may limit to minimum requirements",
            "Contractor pricing reflects current market rates; insurance databases may lag behind",
            "Contractors account for matching and aesthetic concerns; carriers may allow substitutions",
            "Contractors include overhead and profit; carriers may calculate these differently",
            "Contractors plan for unforeseen conditions; carriers estimate only visible damage",
          ],
        },
        {
          heading: "Common Discrepancies Between Estimates",
          body: "Our AI analysis of thousands of estimate comparisons reveals these consistent patterns of discrepancy:",
          bullets: [
            "Missing line items in insurance estimate that contractor includes",
            "Lower quantities in insurance estimate vs contractor measurements",
            "Cheaper materials specified by insurance vs contractor recommendations",
            "Lower labor rates in insurance estimate vs contractor pricing",
            "Missing overhead and profit in insurance calculations",
            "Inadequate allowances for matching discontinued materials",
            "Omitted code upgrade costs in insurance estimate",
            "Different scope interpretations for extent of damage",
          ],
        },
        {
          heading: "Our Estimate Comparison Analysis",
          body: "Upload both your contractor estimate and insurance estimate. Our AI performs comprehensive line-by-line comparison, categorizing discrepancies and building a documented case for why the contractor estimate is justified.",
          bullets: [
            "Side-by-side extraction of all line items from both estimates",
            "Identification of items in contractor estimate missing from insurance estimate",
            "Pricing comparison for matching line items showing differences",
            "Quantity discrepancy analysis for materials and labor",
            "Material quality comparison (e.g., architectural vs 3-tab shingles)",
            "Overhead and profit calculation verification",
            "Professional PDF report documenting all findings",
            "Recommended negotiation strategy based on discrepancy analysis",
          ],
        },
        {
          heading: "How to Use Your Comparison Report",
          body: "Our comparison report provides powerful documentation for insurance negotiations and claim supplements:",
          bullets: [
            "Submit to insurance adjuster with supplement request for missing items",
            "Use in negotiations to justify contractor pricing vs carrier estimate",
            "Provide to public adjuster as foundation for claim supplement",
            "Support appraisal process with objective third-party analysis",
            "Document basis for hiring contractor despite higher estimate",
            "Strengthen legal case if dispute escalates to litigation",
          ],
        },
      ]}
      faqs={[
        {
          question: "Is it normal for my contractor's estimate to be much higher than insurance?",
          answer: "Yes, this is extremely common. Differences of 20-50% or more are typical. Our comparison analysis helps you understand exactly where the discrepancies exist and whether they're justified.",
        },
        {
          question: "Should I hire the contractor with the higher estimate?",
          answer: "Not necessarily. Use our comparison to determine if the higher estimate includes necessary items the insurance estimate missed, or if it's inflated. The analysis helps you make an informed decision.",
        },
        {
          question: "Can I use your comparison report to negotiate with my insurance company?",
          answer: "Absolutely. Our report provides objective, line-by-line documentation of discrepancies. Many customers successfully use this analysis to negotiate higher settlements or approved supplements.",
        },
        {
          question: "What if the insurance company won't budge despite your report?",
          answer: "If negotiations fail, our report provides foundation for appraisal, hiring a public adjuster, or consulting an attorney. The detailed analysis strengthens any escalation path.",
        },
        {
          question: "Can you compare estimates from different software (e.g., Xactimate vs contractor software)?",
          answer: "Yes. Our AI translates between different estimating formats, matching line items even when described differently and comparing pricing despite different software structures.",
        },
        {
          question: "What if my contractor estimate includes items not in the insurance estimate?",
          answer: "Our report identifies all items in the contractor estimate that are missing from the insurance estimate, explaining why each is necessary and providing pricing for supplementation.",
        },
        {
          question: "How do you determine which estimate is more accurate?",
          answer: "We don't declare one estimate 'right' or 'wrong.' Instead, we document specific discrepancies in scope, quantities, and pricing, allowing you to make informed decisions about what's appropriate for your situation.",
        },
        {
          question: "Can you compare multiple contractor estimates to the insurance estimate?",
          answer: "Yes. Upload the insurance estimate plus multiple contractor estimates, and we'll analyze how each compares, helping you choose the best contractor and identify common items missing from insurance.",
        },
      ]}
      ctaLabel="Compare Your Estimates Now"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Estimate Comparison Service",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered side-by-side comparison of contractor and insurance estimates identifying discrepancies, missing items, and pricing differences.",
      }}
    />
  );
}

