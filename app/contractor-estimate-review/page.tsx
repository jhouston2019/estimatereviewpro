import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractor Estimate Review | AI-Powered Analysis | Estimate Review Pro",
  description: "Get your contractor estimate professionally reviewed by AI. Identify missing items, pricing discrepancies, and ensure fair compensation for property damage repairs.",
};

export default function ContractorEstimateReviewPage() {
  return (
    <SeoLandingPage
      title="Contractor Estimate Review"
      subtitle="AI-Powered Analysis to Ensure Fair Pricing and Complete Scope"
      description="When your contractor provides an estimate for property damage repairs, it's critical to verify every line item is accurate, priced fairly, and includes all necessary work. Our AI-powered platform analyzes contractor estimates in minutes, identifying missing items, pricing discrepancies, and scope gaps that could cost you thousands."
      sections={[
        {
          heading: "Why Contractor Estimates Need Professional Review",
          body: "Contractor estimates for insurance claims are complex documents that determine how much money you'll receive for repairs. Even experienced contractors can miss items, underprice materials, or fail to account for hidden damage. Without a thorough review, you risk accepting an incomplete estimate that leaves you paying out-of-pocket for necessary repairs.",
          bullets: [
            "Contractors may inadvertently omit hidden damage not visible during initial inspection",
            "Material costs fluctuate rapidly, and estimates can become outdated within weeks",
            "Labor rates vary significantly by region and specialty trade",
            "Scope creep during repairs often reveals additional damage not in the original estimate",
            "Insurance adjusters may challenge contractor pricing without proper documentation",
          ],
        },
        {
          heading: "Common Problems Found in Contractor Estimates",
          body: "Our AI analysis has reviewed thousands of contractor estimates and consistently identifies these critical issues:",
          bullets: [
            "Missing line items for demolition, disposal, and cleanup work",
            "Underestimated quantities for materials like drywall, roofing, or flooring",
            "Omitted permit fees, inspection costs, and code compliance upgrades",
            "Inadequate allowances for matching existing finishes and materials",
            "Missing overhead and profit margins that contractors are entitled to claim",
            "Failure to account for temporary repairs or loss of use expenses",
            "Incomplete documentation of pre-existing conditions versus new damage",
          ],
        },
        {
          heading: "How Our AI Review Process Works",
          body: "Upload your contractor estimate and our advanced AI extracts every line item, compares pricing against industry databases, and identifies discrepancies in minutes. You'll receive a comprehensive report showing missing items, underpriced work, and recommended adjustments to ensure you receive fair compensation.",
          bullets: [
            "AI extracts all line items including trade, description, quantity, unit price, and totals",
            "Compares pricing against regional cost databases and industry standards",
            "Identifies missing scope items based on damage type and repair requirements",
            "Flags underpriced items that fall below reasonable market rates",
            "Generates professional PDF report with detailed findings and recommendations",
            "Provides plain-English summaries suitable for insurance negotiations",
          ],
        },
        {
          heading: "What You Receive",
          body: "Every contractor estimate review includes a comprehensive analysis package designed to strengthen your insurance claim and ensure complete, fair compensation.",
          bullets: [
            "Complete line-item extraction with trade categorization",
            "Missing items report highlighting omitted work and materials",
            "Pricing analysis comparing contractor rates to market standards",
            "Scope gap identification showing incomplete or vague descriptions",
            "Professional PDF report suitable for insurance submission",
            "Plain-English summary explaining technical findings",
            "Recommended next steps for claim negotiation",
          ],
        },
        {
          heading: "Who Benefits from Contractor Estimate Review",
          body: "Our service helps multiple stakeholders in the insurance claims process ensure accurate, complete estimates that lead to fair settlements.",
          bullets: [
            "Homeowners verifying contractor estimates before accepting insurance settlements",
            "Public adjusters building stronger claims with documented pricing analysis",
            "Contractors validating their own estimates before submitting to insurance carriers",
            "Property managers overseeing multiple repair projects simultaneously",
            "Insurance restoration companies ensuring competitive, defensible pricing",
            "Legal professionals supporting property damage litigation with expert analysis",
          ],
        },
      ]}
      faqs={[
        {
          question: "How accurate is the AI analysis of contractor estimates?",
          answer: "Our AI achieves 95%+ accuracy in line item extraction and has been trained on thousands of contractor estimates across all property damage types. The system recognizes standard construction terminology, trade-specific language, and regional pricing variations.",
        },
        {
          question: "What file formats do you accept for contractor estimates?",
          answer: "We accept PDF, PNG, and JPG files up to 10MB. This includes estimates from Xactimate, Symbility, handwritten contractor quotes, and scanned documents. Our AI can read both typed and clearly handwritten estimates.",
        },
        {
          question: "How long does a contractor estimate review take?",
          answer: "Most contractor estimates are analyzed in under 5 minutes. Complex multi-trade estimates with dozens of line items may take up to 10 minutes. You'll receive real-time status updates as the AI processes your estimate.",
        },
        {
          question: "Can you compare my contractor estimate to the insurance carrier estimate?",
          answer: "Yes! Upload both estimates and our AI will perform a line-by-line comparison, identifying missing items, pricing discrepancies, and scope differences. This comparison is invaluable for negotiating with insurance adjusters.",
        },
        {
          question: "What if the AI finds errors in my contractor's estimate?",
          answer: "The AI report provides specific details about missing items, underpriced work, and scope gaps. You can share this report with your contractor to request revisions, or use it to negotiate directly with your insurance carrier for additional compensation.",
        },
        {
          question: "Do contractors use your service to validate their own estimates?",
          answer: "Yes, many contractors use our service as a quality control check before submitting estimates to insurance carriers. This helps them ensure competitive pricing, complete scope, and defensible documentation that reduces the likelihood of carrier pushback.",
        },
        {
          question: "How much does a contractor estimate review cost?",
          answer: "Single estimate reviews are $79. If you're a public adjuster or contractor handling multiple claims, our unlimited subscription at $249/month provides better value with priority processing and white-label PDF reports.",
        },
        {
          question: "Can I use your report to negotiate with my insurance company?",
          answer: "Absolutely. Our PDF reports are professionally formatted and include detailed findings, pricing comparisons, and recommended adjustments. Many customers successfully use our reports to negotiate higher settlements with insurance carriers.",
        },
        {
          question: "What types of property damage do you cover?",
          answer: "We analyze contractor estimates for all property damage types including fire, water, wind, hail, mold, storm damage, and more. Our AI is trained on estimates from roofing, siding, interior restoration, structural repairs, and all construction trades.",
        },
        {
          question: "Is my contractor estimate data secure?",
          answer: "Yes. All files are encrypted in transit and at rest using bank-level security. We use Supabase with row-level security policies ensuring only you can access your estimates. We never share your data with third parties.",
        },
      ]}
      ctaLabel="Get Your Contractor Estimate Reviewed"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Contractor Estimate Review",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered contractor estimate review service identifying missing items, pricing discrepancies, and scope gaps in property damage repair estimates.",
      }}
    />
  );
}

