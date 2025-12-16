import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Underpayment Review | Claim Underpayment Analysis | Estimate Review Pro",
  description: "Professional review of underpaid insurance claims. AI-powered analysis identifies missing items and pricing discrepancies to recover fair compensation.",
};

export default function InsuranceUnderpaymentReviewPage() {
  return (
    <SeoLandingPage
      title="Insurance Underpayment Review"
      subtitle="Identify and Recover Underpaid Insurance Claim Compensation"
      description="Insurance underpayment is widespread, with carriers paying less than full policy entitlement on millions of claims annually. Our AI analyzes your insurance estimate to identify underpayments, missing items, and pricing discrepancies, building a documented case to recover the compensation you deserve under your policy."
      sections={[
        {
          heading: "Common Insurance Underpayment Tactics",
          body: "Insurance carriers use various strategies to minimize claim payouts, many of which policyholders don't recognize as underpayment:",
          bullets: [
            "Depreciation applied to non-depreciable items like labor and permits",
            "Omission of necessary scope items visible during inspection",
            "Use of outdated pricing databases that don't reflect current costs",
            "Improper application of policy limitations and exclusions",
            "Inadequate allowances for matching discontinued materials",
            "Exclusion of overhead and profit on complex repairs",
            "Underestimated quantities based on visual inspection without measurement",
          ],
        },
        {
          heading: "How to Identify Underpayment",
          body: "Signs your insurance claim may be underpaid include:",
          bullets: [
            "Insurance estimate significantly lower than contractor quotes",
            "Items you know are damaged aren't listed in the estimate",
            "Pricing seems unrealistically low compared to current market rates",
            "Adjuster spent minimal time inspecting your property",
            "Estimate doesn't include overhead and profit for complex repairs",
            "Depreciation applied to items that shouldn't be depreciated",
            "Policy limits applied that don't seem appropriate",
          ],
        },
        {
          heading: "Our Underpayment Analysis Process",
          body: "Upload your insurance estimate and contractor estimates for comprehensive underpayment analysis:",
          bullets: [
            "Line-by-line extraction of insurance estimate items and pricing",
            "Comparison against contractor estimates and regional cost databases",
            "Identification of missing scope items and omitted work",
            "Analysis of depreciation applications and calculations",
            "Review of policy limit applications and exclusions",
            "Documentation of pricing discrepancies with market data",
            "Professional PDF report quantifying total underpayment",
          ],
        },
        {
          heading: "Recovering Underpaid Compensation",
          body: "Our analysis provides foundation for multiple recovery strategies:",
          bullets: [
            "Submit supplement request with detailed documentation",
            "Request re-inspection with our report as supporting evidence",
            "Invoke appraisal clause with objective third-party analysis",
            "Hire public adjuster with our report as starting point",
            "Consult attorney for bad faith claims if underpayment is egregious",
            "File complaint with state insurance department if carrier won't negotiate",
          ],
        },
      ]}
      faqs={[
        {
          question: "How common is insurance underpayment?",
          answer: "Studies show insurance carriers underpay a significant percentage of property damage claims. Underpayment can range from a few thousand dollars to tens of thousands on larger losses.",
        },
        {
          question: "Can your analysis prove my claim is underpaid?",
          answer: "Our analysis provides objective documentation of missing items, pricing discrepancies, and policy application issues. While we can't guarantee carrier acceptance, our reports provide strong evidence for underpayment claims.",
        },
        {
          question: "What if my insurance company won't increase the settlement?",
          answer: "If the carrier refuses to negotiate despite our documentation, consider invoking your policy's appraisal clause, hiring a public adjuster, or consulting an attorney specializing in insurance claims.",
        },
        {
          question: "How much additional compensation can I expect to recover?",
          answer: "Recovery amounts vary widely based on the extent of underpayment. Our analysis quantifies the total underpayment, giving you a clear target for negotiation or legal action.",
        },
        {
          question: "Can you identify improper depreciation in my estimate?",
          answer: "Yes. Our analysis reviews all depreciation applications, identifying items that shouldn't be depreciated (like labor and permits) and verifying depreciation calculations are correct.",
        },
        {
          question: "What if I already settled but now realize I was underpaid?",
          answer: "Some policies allow reopening claims for newly discovered damage or errors. Consult with a public adjuster or attorney about your options, and provide our analysis as documentation.",
        },
        {
          question: "How long does an underpayment review take?",
          answer: "Most underpayment analyses are completed in under 5 minutes, providing comprehensive documentation of missing items and pricing discrepancies.",
        },
        {
          question: "Can your report be used in legal proceedings?",
          answer: "Our reports provide objective, detailed analysis that can support legal claims. However, for litigation, you may also need expert witness testimony from a licensed adjuster or contractor.",
        },
      ]}
      ctaLabel="Review Your Claim for Underpayment"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Insurance Underpayment Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered insurance underpayment review identifying missing items and pricing discrepancies to recover fair claim compensation.",
      }}
    />
  );
}

