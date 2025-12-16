import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tree Damage Estimate Review | Fallen Tree Claims | Estimate Review Pro",
  description: "Professional review of tree damage estimates. Verify removal, structural repairs, and landscaping costs for fallen tree insurance claims.",
};

export default function TreeDamageEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Tree Damage Estimate Review"
      subtitle="Comprehensive Analysis of Fallen Tree and Storm Damage Estimates"
      description="Fallen trees cause damage to roofs, siding, fences, and landscaping. Insurance estimates must account for complete tree removal, structural repairs, and property restoration. Our AI analyzes tree damage estimates to ensure all affected areas are properly scoped, from emergency tree removal through complete structural repairs and landscaping restoration."
      sections={[
        {
          heading: "Understanding Tree Damage Claims",
          body: "Tree damage involves multiple phases and trades, from emergency tree removal through structural repairs and landscaping restoration. Insurance estimates often focus on obvious damage while missing related impacts.",
          bullets: [
            "Emergency tree removal and debris disposal",
            "Roof damage from tree impact and branches",
            "Siding, gutter, and trim damage",
            "Fence and deck damage from fallen trees",
            "Foundation and structural damage from root systems",
            "Landscaping restoration and stump removal",
          ],
        },
        {
          heading: "Common Missing Items in Tree Damage Estimates",
          body: "Our analysis reveals these consistently omitted items in tree damage estimates:",
          bullets: [
            "Complete tree removal including stump grinding",
            "Debris hauling and disposal costs",
            "Hidden roof decking damage under impact area",
            "Gutter and downspout replacement",
            "Fence section replacement beyond immediate impact",
            "Landscaping restoration including grading and seeding",
            "Driveway or walkway repairs from tree removal equipment",
          ],
        },
        {
          heading: "Our Tree Damage Estimate Analysis",
          body: "Upload your tree damage estimate for comprehensive review of all removal and repair costs:",
          bullets: [
            "Verification of complete tree removal and disposal scope",
            "Analysis of structural damage to roof, siding, and fences",
            "Review of hidden damage assessment adequacy",
            "Identification of missing landscaping restoration items",
            "Pricing comparison against regional tree removal and repair costs",
          ],
        },
      ]}
      faqs={[
        {
          question: "Does insurance cover tree removal costs?",
          answer: "Most policies cover tree removal when the tree damages a covered structure. Removal of trees that fell but didn't damage structures may have limited or no coverage. Our analysis helps clarify what should be covered.",
        },
        {
          question: "What if the estimate doesn't include stump removal?",
          answer: "Stump grinding is often necessary for complete restoration. Our report identifies when stump removal should be included and provides pricing for supplementation.",
        },
        {
          question: "Can you verify all structural damage is included?",
          answer: "Yes. Trees often cause hidden damage to roof decking, framing, and foundations. Our analysis identifies whether adequate exploratory work and repairs are included.",
        },
        {
          question: "What if my fence was damaged but isn't in the estimate?",
          answer: "Tree damage often extends beyond the immediate impact area. Our report documents all affected structures including fences, decks, and outbuildings that should be included.",
        },
        {
          question: "How long does a tree damage estimate review take?",
          answer: "Most tree damage estimates are analyzed in under 5 minutes, providing comprehensive review of removal, repairs, and restoration costs.",
        },
      ]}
      ctaLabel="Review Your Tree Damage Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Tree Damage Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered tree damage estimate review verifying removal, structural repairs, and restoration costs in fallen tree insurance claims.",
      }}
    />
  );
}

