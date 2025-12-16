import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Water Damage Estimate Review | Flood & Leak Claim Analysis | Estimate Review Pro",
  description: "Professional review of water damage estimates. Identify missing drying, demolition, and reconstruction costs for burst pipes, floods, and leak damage claims.",
};

export default function WaterEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Water Damage Estimate Review"
      subtitle="Comprehensive Analysis of Water, Flood, and Leak Damage Estimates"
      description="Water damage claims involve complex multi-phase restoration including emergency mitigation, drying, demolition, and reconstruction. Our AI reviews water damage estimates to ensure all phases are properly scoped and priced, identifying missing drying equipment, demolition costs, and reconstruction items that carriers often undervalue or omit."
      sections={[
        {
          heading: "Understanding Water Damage Estimate Complexity",
          body: "Water damage restoration involves multiple specialized trades and phases that must be properly documented and priced. From initial water extraction and drying to complete reconstruction, each phase has specific requirements that insurance estimates often undervalue or omit entirely.",
          bullets: [
            "Emergency mitigation including water extraction and temporary protection",
            "Structural drying with dehumidifiers, air movers, and monitoring equipment",
            "Demolition of water-damaged materials including drywall, flooring, and insulation",
            "Mold remediation if microbial growth is present",
            "Reconstruction of all affected areas to pre-loss condition",
            "Content pack-out, cleaning, and storage during restoration",
          ],
        },
        {
          heading: "Common Missing Items in Water Damage Estimates",
          body: "Our analysis reveals these consistently omitted or undervalued items in water damage estimates:",
          bullets: [
            "Adequate drying equipment quantities and rental duration",
            "Antimicrobial treatment and mold prevention measures",
            "Demolition costs for accessing hidden water damage",
            "Insulation replacement in walls and ceilings",
            "Subfloor drying or replacement under flooring materials",
            "HVAC duct cleaning after water intrusion",
            "Electrical outlet and switch replacement in affected walls",
            "Baseboards, trim, and door casing replacement",
            "Content manipulation fees for moving furniture during work",
          ],
        },
        {
          heading: "Our Water Damage Estimate Analysis",
          body: "Upload your water damage estimate and our AI verifies all restoration phases are properly scoped and priced, identifying gaps that could leave you paying thousands out-of-pocket.",
          bullets: [
            "Verification of adequate drying equipment for affected square footage",
            "Analysis of demolition scope to access all water-damaged materials",
            "Identification of missing mold prevention and antimicrobial treatment",
            "Review of reconstruction scope for completeness",
            "Pricing comparison against regional water restoration costs",
            "Assessment of content handling and storage allowances",
            "Documentation of missing items with industry-standard requirements",
          ],
        },
        {
          heading: "Types of Water Damage We Review",
          body: "Our platform analyzes estimates for all categories of water damage claims:",
          bullets: [
            "Burst pipes and plumbing failures",
            "Roof leaks and storm water intrusion",
            "Appliance failures (water heaters, washing machines, dishwashers)",
            "Sewer backups and sewage contamination",
            "Flood damage from natural disasters",
            "Ice dam damage and frozen pipe bursts",
            "HVAC condensation and drain pan overflow",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do I know if my water damage estimate includes enough drying equipment?",
          answer: "Industry standards require specific equipment quantities based on affected square footage and water category. Our AI verifies the estimate includes adequate dehumidifiers, air movers, and drying duration for your specific damage.",
        },
        {
          question: "What if my estimate doesn't include mold remediation?",
          answer: "If water damage isn't dried within 48-72 hours, mold growth is likely. Our analysis identifies whether mold remediation and antimicrobial treatment should be included based on the timeline and extent of water intrusion.",
        },
        {
          question: "Can you verify demolition scope is adequate?",
          answer: "Yes. We compare the demolition scope against industry standards for accessing water-damaged materials. Inadequate demolition leaves hidden damage that will cause problems later.",
        },
        {
          question: "What if the insurance estimate only covers visible damage?",
          answer: "Water travels through walls, floors, and ceilings causing hidden damage. Our report documents why exploratory demolition and hidden damage assessment are necessary for complete restoration.",
        },
        {
          question: "How long does a water damage estimate review take?",
          answer: "Most water damage estimates are analyzed in under 5 minutes. Complex multi-floor or commercial water damage estimates may take up to 10 minutes.",
        },
        {
          question: "Can you review estimates for sewage contamination?",
          answer: "Yes. Category 3 water damage (sewage) requires specialized handling, disposal, and antimicrobial treatment. Our AI verifies these requirements are properly included and priced.",
        },
        {
          question: "What if my contractor's estimate is much higher than the insurance estimate?",
          answer: "This is very common with water damage. Upload both estimates and we'll provide line-by-line comparison showing exactly where discrepancies exist, helping you negotiate for proper compensation.",
        },
        {
          question: "Do you review flood insurance estimates?",
          answer: "Yes. We analyze estimates from NFIP flood policies and private flood insurance, identifying missing items and pricing discrepancies specific to flood damage restoration.",
        },
        {
          question: "Can your report help me appeal a denied water damage claim?",
          answer: "Our detailed analysis documents missing scope items and pricing discrepancies with industry-standard requirements. Many customers use our reports to support claim appeals and supplements.",
        },
        {
          question: "What if my estimate doesn't include content pack-out costs?",
          answer: "Content pack-out, cleaning, and storage are often necessary during water restoration. Our analysis identifies when these costs should be included and documents appropriate allowances.",
        },
      ]}
      ctaLabel="Review Your Water Damage Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Water Damage Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered water damage estimate review identifying missing drying, demolition, and reconstruction costs in flood and leak insurance claims.",
      }}
    />
  );
}

