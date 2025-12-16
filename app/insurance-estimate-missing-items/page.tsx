import { SeoLandingPage } from "@/components/SeoLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Estimate Missing Items | Find Omitted Work | Estimate Review Pro",
  description: "Identify missing items in insurance estimates. AI-powered analysis finds omitted work, materials, and costs to maximize your property damage claim settlement.",
};

export default function InsuranceEstimateMissingItemsPage() {
  return (
    <SeoLandingPage
      title="Insurance Estimate Missing Items"
      subtitle="AI-Powered Identification of Omitted Work and Materials"
      description="Insurance estimates routinely omit necessary work, materials, and costs that policyholders don't know to look for. Our AI analyzes your estimate against comprehensive scope checklists for your damage type, identifying missing items that could cost you thousands in out-of-pocket expenses if not addressed."
      sections={[
        {
          heading: "Why Items Get Omitted from Insurance Estimates",
          body: "Missing items in insurance estimates occur for various reasons, not all intentional but all costly to policyholders:",
          bullets: [
            "Adjuster didn't see hidden damage during inspection",
            "Software defaults don't include all necessary related work",
            "Adjuster lacks expertise in specific trade requirements",
            "Carrier guidelines limit scope to minimum requirements",
            "Related damage in adjacent areas not assessed",
            "Code compliance upgrades not recognized as necessary",
            "Matching requirements for discontinued materials not addressed",
          ],
        },
        {
          heading: "Most Commonly Missing Items by Damage Type",
          body: "Our analysis reveals consistent patterns of missing items across different damage types:",
          bullets: [
            "Water damage: adequate drying equipment, antimicrobial treatment, insulation replacement",
            "Fire damage: smoke seal primer, HVAC cleaning, odor removal equipment",
            "Roof damage: underlayment, flashing, drip edge, ventilation upgrades",
            "Storm damage: siding beyond immediate impact, gutter replacement, fence repairs",
            "All types: permits, inspections, code upgrades, overhead and profit",
          ],
        },
        {
          heading: "How Our AI Identifies Missing Items",
          body: "Our platform uses comprehensive scope checklists and industry standards to identify omitted work:",
          bullets: [
            "Damage-type specific checklists for complete scope requirements",
            "Trade-by-trade analysis ensuring all necessary work is included",
            "Comparison against contractor estimates showing what's missing",
            "Code compliance verification for required upgrades",
            "Material matching analysis for discontinued products",
            "Related damage identification in adjacent areas",
            "Professional documentation of all missing items with pricing",
          ],
        },
        {
          heading: "Recovering Compensation for Missing Items",
          body: "Once missing items are identified, our reports support multiple recovery strategies:",
          bullets: [
            "Submit supplement request with detailed missing items list",
            "Request re-inspection to document items adjuster missed",
            "Provide contractor quotes showing missing items are necessary",
            "Use our report as foundation for appraisal process",
            "Support public adjuster or attorney with objective analysis",
            "Document basis for bad faith claim if omissions are egregious",
          ],
        },
      ]}
      faqs={[
        {
          question: "How many items are typically missing from insurance estimates?",
          answer: "This varies widely by damage type and claim complexity, but our analysis often identifies 10-30 missing line items representing thousands to tens of thousands in additional compensation.",
        },
        {
          question: "Can you identify items the adjuster couldn't see during inspection?",
          answer: "Yes. Based on the visible damage and damage type, our AI identifies hidden damage items that should be included, like water-damaged insulation behind walls or smoke damage in HVAC systems.",
        },
        {
          question: "What if my contractor says items are needed but insurance says they're not?",
          answer: "Our objective analysis documents why items are necessary based on industry standards and building codes, providing third-party verification that supports your contractor's assessment.",
        },
        {
          question: "How do you know what items should be in my specific estimate?",
          answer: "Our AI is trained on thousands of estimates across all damage types. We use comprehensive scope checklists developed by industry experts for each type of property damage.",
        },
        {
          question: "Can missing items be added after I've already settled?",
          answer: "Some policies allow reopening claims for newly discovered damage or errors. Consult with a public adjuster or attorney about your options, using our analysis as documentation.",
        },
        {
          question: "What if the insurance company denies my supplement for missing items?",
          answer: "Our detailed documentation provides objective evidence for appeals or escalation to appraisal. If the carrier continues to deny legitimate items, consider consulting an attorney.",
        },
        {
          question: "How quickly can you identify missing items in my estimate?",
          answer: "Upload your estimate and receive comprehensive analysis in under 5 minutes, including a detailed list of all missing items with descriptions and pricing.",
        },
        {
          question: "Do you guarantee you'll find missing items?",
          answer: "While we can't guarantee every estimate has missing items, our analysis of thousands of estimates shows the vast majority omit necessary work that should be included.",
        },
      ]}
      ctaLabel="Find Missing Items in Your Estimate"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Insurance Estimate Missing Items Analysis",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "AI-powered identification of missing items in insurance property damage estimates to maximize claim settlements.",
      }}
    />
  );
}

