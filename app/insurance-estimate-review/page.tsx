import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Estimate Review | Carrier Estimate Analysis | Estimate Review Pro",
  description: "Professional review of insurance carrier estimates. Identify underpayments, missing items, and pricing discrepancies to maximize your property damage claim settlement.",
};

export default function InsuranceEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Insurance Estimate Review"
      subtitle="Verify Carrier Estimates and Maximize Your Claim Settlement"
      description="Insurance carriers often provide estimates that undervalue damage, omit necessary repairs, or use outdated pricing. Our AI-powered review compares carrier estimates against industry standards, identifying underpayments and missing items that could cost you tens of thousands in lost compensation."
      sections={[
        {
          heading: "Why Insurance Carrier Estimates Require Independent Review",
          body: "Insurance adjusters work for the carrier, not for you. While most adjusters are professional and fair, their estimates are subject to company guidelines, cost-saving measures, and software limitations that may not fully capture your damage or reflect current market pricing. An independent review protects your interests and ensures you receive the full compensation you're entitled to under your policy.",
          bullets: [
            "Carriers use depreciation schedules that may undervalue materials and labor",
            "Adjusters may miss hidden damage not visible during initial inspection",
            "Software defaults and pricing databases may not reflect current regional costs",
            "Policy exclusions and limitations may be applied incorrectly",
            "Scope may be limited to visible damage without accounting for related repairs",
            "Overhead and profit may be excluded or calculated incorrectly",
          ],
        },
        {
          heading: "Common Underpayment Tactics in Insurance Estimates",
          body: "Our analysis of thousands of carrier estimates reveals consistent patterns of underpayment and scope limitation:",
          bullets: [
            "Depreciation applied to non-depreciable items like labor and permits",
            "Use of 'like kind and quality' clauses to substitute inferior materials",
            "Omission of code upgrade costs required by local building departments",
            "Inadequate allowances for matching discontinued materials or finishes",
            "Exclusion of necessary demolition, disposal, and cleanup costs",
            "Underestimated quantities based on visual inspection without measurements",
            "Failure to include costs for temporary repairs or additional living expenses",
            "Improper application of policy deductibles across multiple damage areas",
          ],
        },
        {
          heading: "Our AI-Powered Insurance Estimate Analysis",
          body: "Upload your insurance carrier estimate and receive a comprehensive analysis identifying underpayments, missing scope, and pricing discrepancies. Our AI compares the carrier estimate against industry standards and your contractor's estimate (if provided) to build a detailed case for additional compensation.",
          bullets: [
            "Line-by-line extraction of all carrier estimate items and pricing",
            "Comparison against regional cost databases and current market rates",
            "Identification of missing scope items and incomplete damage assessment",
            "Analysis of depreciation calculations and policy application",
            "Detection of underpriced materials, labor, and equipment costs",
            "Professional PDF report documenting all findings with supporting data",
            "Plain-English summary suitable for claim appeals and negotiations",
          ],
        },
        {
          heading: "What's Included in Your Insurance Estimate Review",
          body: "Every review provides comprehensive documentation to support your claim negotiation or appeal:",
          bullets: [
            "Complete extraction of all line items from the carrier estimate",
            "Missing items report comparing carrier scope to complete repair requirements",
            "Pricing discrepancy analysis showing undervalued materials and labor",
            "Depreciation review identifying improperly depreciated items",
            "Scope gap analysis highlighting incomplete or inadequate repair descriptions",
            "Side-by-side comparison with contractor estimate (if provided)",
            "Professional PDF report with detailed findings and recommendations",
            "Recommended next steps for claim supplementation or appeal",
          ],
        },
        {
          heading: "Who Uses Insurance Estimate Review Services",
          body: "Our platform serves anyone dealing with property insurance claims who needs to verify carrier estimates and maximize settlements:",
          bullets: [
            "Homeowners challenging low insurance settlements and underpayments",
            "Commercial property owners managing large loss claims",
            "Public adjusters building documented cases for claim supplements",
            "Contractors identifying discrepancies between their estimates and carrier offers",
            "Property managers overseeing insurance claims for multiple properties",
            "Legal professionals supporting property damage litigation and bad faith claims",
            "Insurance restoration companies validating pricing and scope",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do I know if my insurance estimate is too low?",
          answer: "Common signs include: the estimate is significantly lower than contractor quotes, items you know are damaged aren't listed, pricing seems outdated, or the adjuster spent minimal time inspecting your property. Our AI review provides objective analysis to confirm whether your estimate is fair.",
        },
        {
          question: "Can your review help me appeal a denied or underpaid claim?",
          answer: "Yes. Our detailed PDF reports document missing items, pricing discrepancies, and scope gaps with specific line-item analysis. Many customers successfully use our reports to support claim supplements, appeals, and negotiations with insurance carriers.",
        },
        {
          question: "What if my contractor's estimate is much higher than the insurance estimate?",
          answer: "This is extremely common. Upload both estimates and our AI will perform a line-by-line comparison showing exactly where the discrepancies exist. This comparison is invaluable for negotiating with adjusters and documenting the need for additional compensation.",
        },
        {
          question: "How accurate is your pricing analysis compared to actual market rates?",
          answer: "Our AI is trained on regional cost databases, current material prices, and thousands of real-world estimates. We account for geographic variations, current market conditions, and trade-specific pricing to provide accurate, defensible pricing analysis.",
        },
        {
          question: "Will my insurance company accept your AI-generated report?",
          answer: "Our reports are professionally formatted and include detailed, objective analysis with supporting data. While we can't guarantee carrier acceptance, many customers successfully use our reports in negotiations. For disputed claims, consider hiring a public adjuster or attorney who can leverage our analysis.",
        },
        {
          question: "How long does it take to review an insurance estimate?",
          answer: "Most insurance estimates are analyzed in under 5 minutes. You'll receive real-time status updates and can download your comprehensive PDF report as soon as processing completes.",
        },
        {
          question: "Can you review Xactimate estimates from insurance companies?",
          answer: "Yes! We specialize in reviewing Xactimate estimates, which are used by most major insurance carriers. Our AI recognizes Xactimate formatting, line codes, and pricing structures to provide accurate analysis.",
        },
        {
          question: "What should I do if your review finds significant underpayments?",
          answer: "First, share our report with your contractor to confirm the findings. Then, submit a supplement request to your insurance carrier with our report as supporting documentation. If the carrier denies the supplement, consider hiring a public adjuster or consulting an attorney.",
        },
        {
          question: "Do you review estimates for all types of property damage?",
          answer: "Yes. We analyze insurance estimates for fire damage, water damage, wind and hail, storm damage, mold remediation, structural repairs, and all other property damage types covered by homeowners, commercial, and flood insurance policies.",
        },
        {
          question: "Is my insurance estimate information kept confidential?",
          answer: "Absolutely. All uploaded estimates are encrypted and stored securely with bank-level security. We never share your data with insurance companies, contractors, or third parties. Your estimate review is completely confidential.",
        },
      ]}
      ctaLabel="Review Your Insurance Estimate Now"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Insurance Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered insurance carrier estimate review identifying underpayments, missing items, and pricing discrepancies in property damage claims.",
      }}
    />
  );
}

