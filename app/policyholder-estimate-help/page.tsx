import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policyholder Estimate Help | Insurance Claim Assistance | Estimate Review Pro",
  description: "Professional estimate review help for policyholders. Understand your insurance estimate, identify missing items, and maximize your claim settlement.",
};

export default function PolicyholderEstimateHelpPage() {
  return (
    <SeoLandingPage
      title="Policyholder Estimate Help"
      subtitle="Expert Guidance for Understanding and Maximizing Your Insurance Claim"
      description="Navigating property insurance claims is overwhelming for policyholders. Our AI-powered platform helps you understand your insurance estimate, identify missing items, compare contractor quotes, and build a strong case for fair compensation—all without needing to become an insurance expert yourself."
      sections={[
        {
          heading: "Common Policyholder Challenges",
          body: "Property insurance claims involve complex estimates, technical terminology, and negotiation with experienced adjusters. Policyholders face numerous challenges:",
          bullets: [
            "Understanding technical construction terminology in estimates",
            "Knowing whether the insurance estimate is fair and complete",
            "Comparing contractor quotes to insurance estimates",
            "Identifying missing items and scope gaps",
            "Negotiating with adjusters who have more experience",
            "Determining when to hire a public adjuster or attorney",
            "Understanding policy coverage, exclusions, and limitations",
          ],
        },
        {
          heading: "How Our Platform Helps Policyholders",
          body: "Our AI provides the expertise and analysis policyholders need to level the playing field:",
          bullets: [
            "Plain-English explanations of estimate contents and findings",
            "Identification of missing items you may not know to look for",
            "Objective comparison of insurance vs contractor estimates",
            "Documentation of discrepancies with supporting data",
            "Guidance on next steps based on your specific situation",
            "Professional reports you can submit to your insurance company",
            "Educational resources to understand the claims process",
          ],
        },
        {
          heading: "Step-by-Step Claim Assistance",
          body: "Our platform guides policyholders through each stage of the claims process:",
          bullets: [
            "Initial estimate review to identify immediate concerns",
            "Contractor quote comparison to verify pricing",
            "Supplement preparation when additional damage is found",
            "Negotiation support with documented analysis",
            "Appeal assistance if your claim is denied or underpaid",
            "Guidance on when to escalate to appraisal or legal action",
          ],
        },
        {
          heading: "When to Seek Additional Help",
          body: "Our analysis helps you determine when professional representation is warranted:",
          bullets: [
            "Large loss claims exceeding $50,000 may benefit from public adjuster",
            "Denied claims often require attorney review",
            "Complex commercial claims need specialized expertise",
            "Bad faith situations require legal representation",
            "Multiple property claims may justify professional management",
          ],
        },
      ]}
      faqs={[
        {
          question: "I don't understand construction terminology. Can you help?",
          answer: "Yes. Our reports include plain-English summaries explaining what each finding means and why it matters. You don't need construction expertise to use our platform effectively.",
        },
        {
          question: "How do I know if I need a public adjuster?",
          answer: "Public adjusters typically charge 10-15% of the settlement. For claims under $25,000, our platform may provide sufficient analysis. For larger or complex claims, a public adjuster may be worthwhile, and our analysis gives them a strong starting point.",
        },
        {
          question: "Can I use your reports to negotiate with my insurance company myself?",
          answer: "Yes. Many policyholders successfully negotiate higher settlements using our reports. We provide detailed documentation of missing items and pricing discrepancies that adjusters can verify.",
        },
        {
          question: "What if my claim was denied?",
          answer: "Our analysis helps you understand why items may have been denied and whether the denial is justified. This information is valuable for appeals or consulting with an attorney.",
        },
        {
          question: "How much does your service cost compared to a public adjuster?",
          answer: "Our service costs $79 for a single review or $249/month for unlimited reviews. Public adjusters typically charge 10-15% of the settlement, which could be thousands or tens of thousands of dollars.",
        },
        {
          question: "Can you help me understand my policy coverage?",
          answer: "While we focus on estimate analysis, our reports help identify which items should be covered under standard policies. For specific policy interpretation, consult with a public adjuster or attorney.",
        },
        {
          question: "What if I'm not satisfied with your analysis?",
          answer: "We offer a satisfaction guarantee. If you're not satisfied with your first review, contact us within 7 days for a full refund.",
        },
        {
          question: "How quickly can I get help with my estimate?",
          answer: "Upload your estimate and receive comprehensive analysis in under 5 minutes. You can download your PDF report immediately and start using it in negotiations.",
        },
      ]}
      ctaLabel="Get Help with Your Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Policyholder Estimate Help",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered estimate review assistance for policyholders providing expert analysis and guidance for insurance claim negotiations.",
      }}
    />
  );
}

