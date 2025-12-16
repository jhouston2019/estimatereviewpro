import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fire Damage Estimate Review | Smoke & Fire Claim Analysis | Estimate Review Pro",
  description: "Professional review of fire and smoke damage estimates. Identify missing demolition, cleaning, odor removal, and reconstruction costs in fire insurance claims.",
};

export default function FireEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Fire Damage Estimate Review"
      subtitle="Expert Analysis of Fire and Smoke Damage Insurance Estimates"
      description="Fire damage claims are among the most complex, involving structural repairs, smoke remediation, odor removal, and complete reconstruction. Our AI analyzes fire damage estimates to ensure all phases are properly scoped, from emergency board-up through final reconstruction, identifying missing items that could cost you tens of thousands."
      sections={[
        {
          heading: "Why Fire Damage Estimates Require Expert Review",
          body: "Fire damage extends far beyond visible burn areas. Smoke penetrates walls, HVAC systems, and contents throughout the property. Heat damage weakens structural components even without visible burning. Insurance estimates often focus only on obvious damage while missing critical smoke remediation, odor removal, and hidden structural damage.",
          bullets: [
            "Smoke damage extends throughout the property, not just fire-affected areas",
            "HVAC systems require complete cleaning or replacement after smoke exposure",
            "Structural members may be heat-damaged without visible burning",
            "Odor removal requires specialized equipment and techniques",
            "Contents require professional cleaning or replacement",
            "Code upgrades are often triggered by extent of fire damage",
          ],
        },
        {
          heading: "Common Missing Items in Fire Damage Estimates",
          body: "Our analysis of fire damage estimates consistently reveals these omitted or undervalued items:",
          bullets: [
            "Complete HVAC duct cleaning or replacement throughout property",
            "Thermal fogging and ozone treatment for odor removal",
            "Smoke seal primer on all surfaces before painting",
            "Insulation replacement in walls and attics exposed to smoke",
            "Electrical system inspection and component replacement",
            "Roof decking and structural member replacement for heat damage",
            "Content pack-out, cleaning, and storage during reconstruction",
            "Temporary housing costs during extended reconstruction",
          ],
        },
        {
          heading: "Our Fire Damage Estimate Analysis",
          body: "Upload your fire damage estimate and receive comprehensive analysis of all restoration phases, from emergency mitigation through final reconstruction:",
          bullets: [
            "Verification of adequate demolition scope to remove all fire-damaged materials",
            "Analysis of smoke remediation and odor removal requirements",
            "Review of structural repair scope for heat-damaged components",
            "Identification of missing HVAC cleaning or replacement",
            "Assessment of content cleaning vs replacement decisions",
            "Pricing comparison against regional fire restoration costs",
            "Documentation of code upgrade requirements",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do I know if my fire damage estimate includes adequate smoke remediation?",
          answer: "Our AI verifies the estimate includes smoke seal primer, HVAC cleaning, odor removal equipment, and content cleaning for all affected areas. Smoke damage extends far beyond visible fire damage and requires comprehensive treatment.",
        },
        {
          question: "What if my estimate doesn't include HVAC duct cleaning?",
          answer: "HVAC systems circulate smoke throughout the property and must be professionally cleaned or replaced. Our report documents why this is necessary and provides pricing for proper remediation.",
        },
        {
          question: "Can you identify missing structural repairs from heat damage?",
          answer: "Yes. Heat weakens structural members even without visible burning. Our analysis identifies when structural inspection and reinforcement should be included based on fire severity and location.",
        },
        {
          question: "How long does a fire damage estimate review take?",
          answer: "Most fire damage estimates are analyzed in under 5 minutes. Large loss fires affecting entire structures may take up to 10 minutes for complete analysis.",
        },
        {
          question: "What if my contractor's fire damage estimate is much higher than insurance?",
          answer: "This is extremely common. Upload both estimates for line-by-line comparison showing exactly where discrepancies exist, particularly in smoke remediation and hidden damage items.",
        },
        {
          question: "Do you review estimates for smoke damage without fire?",
          answer: "Yes. Smoke damage from nearby fires or malfunctioning appliances requires specialized cleaning and odor removal. Our AI analyzes smoke-only damage estimates for completeness.",
        },
        {
          question: "Can your report help me get additional living expenses covered?",
          answer: "Our analysis documents the extent of damage and estimated reconstruction timeline, supporting your request for adequate temporary housing allowances during repairs.",
        },
        {
          question: "What if my estimate doesn't include content cleaning costs?",
          answer: "Content cleaning or replacement is a major component of fire claims. Our report identifies missing content handling costs and documents appropriate allowances based on damage extent.",
        },
      ]}
      ctaLabel="Review Your Fire Damage Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Fire Damage Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered fire and smoke damage estimate review identifying missing remediation, cleaning, and reconstruction costs in fire insurance claims.",
      }}
    />
  );
}

