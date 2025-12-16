import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roof Estimate Review | Roofing Claim Analysis | Estimate Review Pro",
  description: "Professional review of roof damage estimates. Identify missing shingles, underlayment, flashing, and ensure accurate measurements for wind, hail, and storm damage claims.",
};

export default function RoofEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Roof Estimate Review"
      subtitle="Expert Analysis of Roofing Damage Estimates and Insurance Claims"
      description="Roof damage claims are among the most disputed in property insurance. Our AI-powered review analyzes roofing estimates for wind, hail, and storm damage, verifying measurements, identifying missing components like underlayment and flashing, and ensuring you receive full compensation for complete roof replacement or repair."
      sections={[
        {
          heading: "Why Roof Estimates Require Professional Review",
          body: "Roofing estimates are complex and involve multiple components beyond just shingles. Insurance carriers often underestimate square footage, omit necessary underlayment and flashing, or attempt partial repairs when full replacement is warranted. A professional review ensures your estimate includes all necessary materials, labor, and related costs.",
          bullets: [
            "Roof measurements from ground level may underestimate actual square footage",
            "Hidden damage to decking, underlayment, and ventilation is often missed",
            "Flashing, drip edge, and valley metal are frequently omitted or undervalued",
            "Code upgrades for ice and water shield may not be included",
            "Matching discontinued shingles often requires full roof replacement",
            "Waste factors and pitch multipliers may be calculated incorrectly",
          ],
        },
        {
          heading: "Common Missing Items in Roof Estimates",
          body: "Our analysis of thousands of roofing estimates reveals these consistently omitted or undervalued items:",
          bullets: [
            "Synthetic underlayment or ice and water shield required by code",
            "Drip edge, rake edge, and valley metal replacement",
            "Pipe boots, vent flashing, and chimney cricket repairs",
            "Ridge vent, soffit vent, and attic ventilation upgrades",
            "Roof decking replacement for water-damaged or hail-damaged sheathing",
            "Gutter and downspout replacement damaged by falling debris",
            "Skylight flashing and seal replacement",
            "Satellite dish or solar panel removal and reinstallation costs",
          ],
        },
        {
          heading: "Our Roof Estimate Analysis Process",
          body: "Upload your roofing estimate and our AI extracts every line item, verifies measurements, and identifies missing components. We compare pricing against regional roofing costs and flag discrepancies that could cost you thousands.",
          bullets: [
            "Extraction of all roofing materials, quantities, and pricing",
            "Verification of square footage calculations and pitch multipliers",
            "Identification of missing underlayment, flashing, and accessory items",
            "Analysis of shingle quality and matching requirements",
            "Review of code compliance items and permit requirements",
            "Comparison of pricing against regional roofing contractor rates",
            "Assessment of whether partial repair or full replacement is appropriate",
          ],
        },
        {
          heading: "What's Included in Your Roof Estimate Review",
          body: "Every roofing estimate review provides comprehensive analysis and documentation:",
          bullets: [
            "Complete extraction of all roofing materials and labor line items",
            "Missing items report for underlayment, flashing, and accessories",
            "Measurement verification comparing estimate to actual roof dimensions",
            "Pricing analysis comparing estimate to regional roofing costs",
            "Code compliance review identifying required upgrades",
            "Professional PDF report with detailed findings",
            "Recommended next steps for claim supplementation",
          ],
        },
        {
          heading: "Types of Roof Damage We Analyze",
          body: "Our platform reviews roofing estimates for all damage types and claim scenarios:",
          bullets: [
            "Wind damage including missing shingles and blown-off ridge caps",
            "Hail damage requiring impact testing and shingle replacement",
            "Storm damage from fallen trees, branches, and debris",
            "Ice dam damage to gutters, fascia, and roof decking",
            "Aging and wear requiring full roof replacement",
            "Leak damage to decking, underlayment, and interior ceilings",
            "Fire damage to roof structure and covering materials",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do I know if my roof estimate includes all necessary materials?",
          answer: "Our AI compares your estimate against comprehensive roofing scope checklists. We identify missing items like underlayment, flashing, drip edge, and ventilation components that are essential for a complete, code-compliant roof replacement.",
        },
        {
          question: "What if the insurance estimate says repair but my contractor recommends replacement?",
          answer: "This is extremely common. Upload both estimates and our AI will document the discrepancy. We'll identify factors supporting full replacement like age, matching issues, and extent of damage. This analysis strengthens your case for replacement coverage.",
        },
        {
          question: "Can you verify roof measurements in the estimate?",
          answer: "Yes. We compare the square footage in your estimate against typical measurements for your home size and roof configuration. Significant discrepancies may indicate the adjuster underestimated from ground level without actually measuring the roof.",
        },
        {
          question: "What if my estimate doesn't include underlayment or ice and water shield?",
          answer: "These are critical components required by building code in most regions. Our report will flag missing underlayment and ice/water shield, documenting why they're necessary and providing pricing for supplementation.",
        },
        {
          question: "How do you determine if shingle pricing is fair?",
          answer: "We compare the shingle type, quality, and pricing in your estimate against current regional costs for comparable products. We account for architectural vs 3-tab shingles, manufacturer, and warranty levels.",
        },
        {
          question: "Can you review estimates for both asphalt shingles and other roofing materials?",
          answer: "Yes. We analyze estimates for asphalt shingles, metal roofing, tile, slate, and flat/low-slope roofing systems. Our AI recognizes material-specific components and pricing structures.",
        },
        {
          question: "What if my roof estimate doesn't include code upgrade costs?",
          answer: "Building codes change over time, and roof replacements often trigger upgrade requirements. Our analysis identifies missing code compliance items and documents why they're necessary for permit approval.",
        },
        {
          question: "How long does a roof estimate review take?",
          answer: "Most roofing estimates are analyzed in under 5 minutes. You'll receive a comprehensive PDF report with all findings, missing items, and pricing discrepancies as soon as processing completes.",
        },
        {
          question: "Can I use your report to get a higher settlement from my insurance company?",
          answer: "Many customers successfully use our reports to supplement their claims. The detailed, line-item analysis provides objective documentation of missing items and pricing discrepancies that adjusters can verify.",
        },
        {
          question: "Do you review roof estimates for commercial properties?",
          answer: "Yes. We analyze roofing estimates for residential, commercial, and multi-family properties. Our AI handles estimates for all roof types including flat, low-slope, and steep-slope configurations.",
        },
      ]}
      ctaLabel="Review Your Roof Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Roof Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered roof damage estimate review identifying missing materials, measurement errors, and pricing discrepancies in roofing insurance claims.",
      }}
    />
  );
}

