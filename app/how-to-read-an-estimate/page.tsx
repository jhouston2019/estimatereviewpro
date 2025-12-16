import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Read an Estimate | Understanding Construction Estimates | Estimate Review Pro",
  description: "Learn how to read and understand construction and insurance estimates. Expert guide to line items, pricing, and identifying missing items in property damage estimates.",
};

export default function HowToReadAnEstimatePage() {
  return (
    <SeoLandingPage
      title="How to Read an Estimate"
      subtitle="Expert Guide to Understanding Construction and Insurance Estimates"
      description="Property damage estimates contain complex terminology, line items, and pricing structures that can be overwhelming. Learn how to read estimates like a professional, understand what each section means, identify missing items, and verify pricing is fair—essential knowledge for every property owner dealing with insurance claims."
      sections={[
        {
          heading: "Estimate Structure and Components",
          body: "Professional estimates follow a standard structure with specific components you need to understand:",
          bullets: [
            "Header information: property address, date, estimator details",
            "Scope summary: overview of work to be performed",
            "Line items: detailed list of materials and labor",
            "Trade categories: grouping by type of work (roofing, plumbing, etc.)",
            "Quantities: measurements and counts for each item",
            "Unit prices: cost per unit of measure",
            "Extensions: quantity multiplied by unit price",
            "Subtotals: totals by trade or section",
            "Overhead and profit: contractor markup",
            "Grand total: final estimate amount",
          ],
        },
        {
          heading: "Understanding Line Items",
          body: "Each line item in an estimate contains critical information you need to verify:",
          bullets: [
            "Line code or item number (especially in Xactimate estimates)",
            "Description: what work or material the line represents",
            "Quantity: how much of the item is needed",
            "Unit of measure: SF (square feet), LF (linear feet), EA (each), etc.",
            "Unit price: cost per unit of measure",
            "Total: quantity times unit price",
            "Notes: special conditions or clarifications",
          ],
        },
        {
          heading: "Red Flags to Watch For",
          body: "Learn to identify common issues that indicate an estimate may be incomplete or inaccurate:",
          bullets: [
            "Vague descriptions like 'repairs as needed' without specifics",
            "Missing quantities or 'TBD' (to be determined) entries",
            "Unusually low pricing compared to other estimates",
            "Missing entire trades or categories of work",
            "No allowance for overhead and profit on complex repairs",
            "Inadequate contingency for unforeseen conditions",
            "Missing permits, inspections, or code compliance items",
            "No provision for matching discontinued materials",
          ],
        },
        {
          heading: "Comparing Multiple Estimates",
          body: "When comparing contractor and insurance estimates, focus on these key areas:",
          bullets: [
            "Scope differences: what work is included in each estimate",
            "Quantity discrepancies: different measurements or calculations",
            "Material quality: specifications for different grade products",
            "Labor rates: hourly or per-unit labor costs",
            "Overhead and profit: how these are calculated",
            "Total project cost: final bottom-line comparison",
          ],
        },
        {
          heading: "Using Our AI to Verify Your Estimate",
          body: "Our platform automates the estimate review process, providing expert analysis in minutes:",
          bullets: [
            "Extracts all line items with quantities and pricing",
            "Identifies missing items based on damage type",
            "Compares pricing against regional databases",
            "Flags vague descriptions and inadequate quantities",
            "Generates professional report with findings",
            "Provides plain-English explanations of issues",
          ],
        },
      ]}
      faqs={[
        {
          question: "What does 'RCV' and 'ACV' mean in insurance estimates?",
          answer: "RCV (Replacement Cost Value) is the full cost to replace damaged items with new. ACV (Actual Cash Value) is RCV minus depreciation. Most policies pay ACV initially, then RCV after repairs are completed.",
        },
        {
          question: "What is overhead and profit, and should it be in my estimate?",
          answer: "Overhead and profit (O&P) is the contractor's markup for business costs and profit margin, typically 10% overhead and 10% profit. It should be included when repairs involve multiple trades or complex coordination.",
        },
        {
          question: "How do I know if quantities in the estimate are accurate?",
          answer: "Verify quantities by comparing to your property's actual dimensions. For roofing, check square footage against tax records or contractor measurements. Our AI flags quantity discrepancies when comparing multiple estimates.",
        },
        {
          question: "What are Xactimate line codes?",
          answer: "Xactimate line codes are standardized item numbers used by insurance estimating software. Each code represents a specific repair task with a standard description and pricing. Understanding these codes helps verify estimates are accurate.",
        },
        {
          question: "Should I accept the lowest estimate?",
          answer: "Not necessarily. The lowest estimate may omit necessary work or use inferior materials. Compare scope and quality, not just price. Our platform helps identify what's missing from lower estimates.",
        },
        {
          question: "What if I don't understand the terminology in my estimate?",
          answer: "Our AI analysis includes plain-English summaries explaining technical terms and findings. You don't need construction expertise to understand our reports.",
        },
        {
          question: "How detailed should a good estimate be?",
          answer: "Professional estimates should include specific descriptions, accurate quantities, clear unit prices, and comprehensive scope. Vague estimates with 'allowances' or 'TBD' entries are red flags.",
        },
        {
          question: "Can your platform teach me to read estimates?",
          answer: "Yes. Our detailed reports show you exactly what's in your estimate, what's missing, and why it matters. Over time, you'll learn to spot issues yourself.",
        },
      ]}
      ctaLabel="Get Your Estimate Analyzed"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Read a Construction Estimate",
        "description": "Expert guide to understanding and verifying construction and insurance property damage estimates.",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
      }}
    />
  );
}

