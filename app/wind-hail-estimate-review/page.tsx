import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wind & Hail Damage Estimate Review | Storm Claim Analysis | Estimate Review Pro",
  description: "Professional review of wind and hail damage estimates. Identify missing roof, siding, and exterior damage items to maximize your storm insurance claim settlement.",
};

export default function WindHailEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Wind & Hail Damage Estimate Review"
      subtitle="Comprehensive Analysis of Storm Damage Insurance Estimates"
      description="Wind and hail damage affects multiple exterior components including roofing, siding, gutters, windows, and landscaping. Insurance estimates often focus only on obvious damage while missing related items. Our AI analyzes storm damage estimates to ensure all affected components are properly scoped and priced for complete restoration."
      sections={[
        {
          heading: "Understanding Wind and Hail Damage Claims",
          body: "Storm damage is rarely limited to just the roof. High winds and hail impact all exterior surfaces, and insurance estimates must account for comprehensive damage to achieve full restoration. Carriers often underestimate the extent of damage or omit related components.",
          bullets: [
            "Roof damage including shingles, underlayment, flashing, and decking",
            "Siding damage from hail impacts and wind-driven debris",
            "Gutter and downspout damage from hail and falling branches",
            "Window and door damage from hail and wind pressure",
            "Fence and deck damage from wind and falling debris",
            "HVAC and exterior equipment damage from hail",
          ],
        },
        {
          heading: "Common Missing Items in Storm Damage Estimates",
          body: "Our analysis reveals these consistently omitted items in wind and hail estimates:",
          bullets: [
            "Complete roof replacement when matching is impossible",
            "Siding replacement beyond immediately visible damage",
            "Gutter and downspout replacement for hail damage",
            "Window screen and frame replacement",
            "Soffit, fascia, and trim damage from wind",
            "Fence and deck repairs from fallen trees and debris",
            "Landscaping restoration and tree removal costs",
          ],
        },
        {
          heading: "Our Storm Damage Estimate Analysis",
          body: "Upload your wind and hail damage estimate for comprehensive review of all exterior components:",
          bullets: [
            "Verification of complete roof damage assessment",
            "Analysis of siding damage extent and replacement needs",
            "Review of gutter, window, and trim damage inclusion",
            "Identification of missing exterior component repairs",
            "Pricing comparison against regional storm restoration costs",
            "Documentation of matching requirements for discontinued materials",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do I know if my entire roof needs replacement vs just repairs?",
          answer: "If hail or wind damage is widespread, or if matching discontinued shingles is impossible, full replacement may be necessary. Our analysis documents the extent of damage and matching issues to support replacement claims.",
        },
        {
          question: "What if my estimate only includes roof damage but siding is also damaged?",
          answer: "Storm damage typically affects multiple exterior components. Our report identifies missing siding, gutter, window, and other exterior damage that should be included in your claim.",
        },
        {
          question: "Can you verify hail damage is properly documented?",
          answer: "Yes. We verify the estimate includes appropriate scope for hail damage including impact testing results, shingle replacement, and related component damage consistent with hail severity.",
        },
        {
          question: "What if my contractor finds more damage than the insurance estimate includes?",
          answer: "Upload both estimates for side-by-side comparison. Our analysis documents the additional damage and builds a case for claim supplementation.",
        },
        {
          question: "How long does a wind and hail estimate review take?",
          answer: "Most storm damage estimates are analyzed in under 5 minutes, providing comprehensive review of all exterior components.",
        },
      ]}
      ctaLabel="Review Your Storm Damage Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Wind and Hail Damage Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered wind and hail damage estimate review identifying missing exterior damage items in storm insurance claims.",
      }}
    />
  );
}

