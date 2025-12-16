import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Damage Estimate Review | All Damage Types | Estimate Review Pro",
  description: "Professional review of property damage estimates for all claim types. AI-powered analysis identifies missing items and pricing discrepancies to maximize your settlement.",
};

export default function PropertyDamageEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Property Damage Estimate Review"
      subtitle="Comprehensive Analysis for All Types of Property Damage Claims"
      description="Whether your property suffered fire, water, wind, hail, mold, or other damage, accurate estimates are critical to fair compensation. Our AI platform analyzes property damage estimates across all damage types and trades, identifying missing items, pricing discrepancies, and scope gaps that could cost you thousands in lost compensation."
      sections={[
        {
          heading: "All Property Damage Types Covered",
          body: "Our AI is trained on estimates across every type of property damage claim, providing comprehensive analysis regardless of your specific situation:",
          bullets: [
            "Fire and smoke damage including structural repairs and odor removal",
            "Water damage from floods, leaks, and burst pipes",
            "Wind and hail damage to roofing, siding, and exterior components",
            "Mold remediation and moisture damage",
            "Storm damage including tree falls and debris impact",
            "Vandalism and theft damage repairs",
            "Vehicle impact and structural damage",
            "Foundation and structural issues",
          ],
        },
        {
          heading: "Why Property Damage Estimates Need Review",
          body: "Property damage claims involve complex, multi-trade restoration work that insurance adjusters may not fully capture in initial estimates:",
          bullets: [
            "Hidden damage not visible during initial inspection",
            "Related damage to adjacent areas and systems",
            "Code upgrades triggered by extent of repairs",
            "Material matching issues requiring larger scope",
            "Specialized cleaning and remediation requirements",
            "Temporary repairs and loss of use expenses",
          ],
        },
        {
          heading: "Our Comprehensive Analysis Process",
          body: "Upload your property damage estimate and receive detailed analysis across all trades and damage types:",
          bullets: [
            "Complete extraction of all line items across all trades",
            "Identification of missing scope items based on damage type",
            "Pricing comparison against regional cost databases",
            "Analysis of material specifications and quality",
            "Review of code compliance and permit requirements",
            "Professional PDF report with detailed findings",
          ],
        },
      ]}
      faqs={[
        {
          question: "Do you review estimates for all types of property damage?",
          answer: "Yes. Our AI analyzes estimates for fire, water, wind, hail, mold, storm damage, and all other property damage types covered by homeowners, commercial, and flood insurance policies.",
        },
        {
          question: "Can you review estimates for commercial properties?",
          answer: "Yes. We analyze estimates for residential, commercial, multi-family, and industrial properties across all damage types and construction trades.",
        },
        {
          question: "What if my damage involves multiple types (e.g., fire and water)?",
          answer: "Our AI handles complex multi-type damage scenarios, ensuring all aspects of restoration are properly scoped and priced in the estimate.",
        },
        {
          question: "How accurate is the AI across different damage types?",
          answer: "Our AI is trained on thousands of estimates across all damage types and achieves 95%+ accuracy in line item extraction and missing item identification regardless of damage type.",
        },
        {
          question: "Can you compare estimates from different contractors?",
          answer: "Yes. Upload multiple contractor estimates plus the insurance estimate for comprehensive comparison showing where each differs and why.",
        },
      ]}
      ctaLabel="Review Your Property Damage Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Property Damage Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered property damage estimate review for all damage types identifying missing items and pricing discrepancies in insurance claims.",
      }}
    />
  );
}

