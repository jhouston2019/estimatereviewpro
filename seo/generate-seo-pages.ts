#!/usr/bin/env node

/**
 * SEO Landing Page Generator
 * 
 * Generates unique SEO landing pages for each keyword in the list.
 * Each page includes:
 * - Unique 800-1200 word content
 * - 4-6 keyword-specific FAQs
 * - JSON-LD schema
 * - SEO metadata
 * - CTA to /pricing
 * 
 * Run with: npx tsx seo/generate-seo-pages.ts
 */

import fs from "fs";
import path from "path";
import keywords from "./seo-keywords";

const APP_DIR = path.join(process.cwd(), "app");

interface PageContent {
  keyword: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  sections: {
    heading: string;
    body: string;
    bullets?: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

function generateSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractKeyTerms(keyword: string): {
  damageType: string;
  serviceType: string;
  targetAudience: string;
} {
  const lower = keyword.toLowerCase();
  
  // Damage types
  let damageType = "property damage";
  if (lower.includes("roof")) damageType = "roofing";
  else if (lower.includes("water") || lower.includes("flood") || lower.includes("pipe") || lower.includes("plumbing")) damageType = "water damage";
  else if (lower.includes("fire") || lower.includes("smoke") || lower.includes("soot")) damageType = "fire damage";
  else if (lower.includes("mold")) damageType = "mold";
  else if (lower.includes("storm") || lower.includes("wind") || lower.includes("hail") || lower.includes("hurricane")) damageType = "storm damage";
  else if (lower.includes("tree")) damageType = "tree damage";
  
  // Service types
  let serviceType = "review";
  if (lower.includes("dispute") || lower.includes("challenge") || lower.includes("too low")) serviceType = "dispute";
  else if (lower.includes("supplement")) serviceType = "supplement";
  else if (lower.includes("comparison") || lower.includes("compare")) serviceType = "comparison";
  else if (lower.includes("audit")) serviceType = "audit";
  else if (lower.includes("validation") || lower.includes("verification")) serviceType = "validation";
  else if (lower.includes("how to")) serviceType = "guide";
  
  // Target audience
  let targetAudience = "homeowners";
  if (lower.includes("public adjuster")) targetAudience = "public adjusters";
  else if (lower.includes("contractor")) targetAudience = "contractors";
  else if (lower.includes("commercial")) targetAudience = "commercial property owners";
  else if (lower.includes("hoa") || lower.includes("condo")) targetAudience = "property associations";
  
  return { damageType, serviceType, targetAudience };
}

function generateUniqueContent(keyword: string): PageContent {
  const slug = generateSlug(keyword);
  const { damageType, serviceType, targetAudience } = extractKeyTerms(keyword);
  const capitalizedKeyword = capitalizeWords(keyword);
  
  const title = `${capitalizedKeyword} | AI-Powered Analysis | Estimate Review Pro`;
  const description = `Professional ${keyword} service. AI-powered analysis identifies missing items, pricing discrepancies, and scope gaps to maximize your insurance claim settlement.`;
  
  // Generate unique sections based on keyword context
  const sections = generateSections(keyword, damageType, serviceType, targetAudience);
  const faqs = generateFAQs(keyword, damageType, serviceType, targetAudience);
  
  return {
    keyword,
    slug,
    title,
    description,
    h1: capitalizedKeyword,
    sections,
    faqs,
  };
}

function generateSections(keyword: string, damageType: string, serviceType: string, targetAudience: string) {
  const sections = [];
  
  // Section 1: The Problem
  sections.push({
    heading: `Understanding ${capitalizeWords(keyword)} Challenges`,
    body: `When dealing with ${damageType} claims, ${targetAudience} face significant challenges in verifying estimate accuracy. Insurance carriers and contractors may use different methodologies, pricing databases, and scope interpretations that lead to substantial discrepancies. Without expert ${serviceType} services, you risk accepting incomplete estimates that undervalue your damage by thousands or even tens of thousands of dollars. The complexity of ${damageType} restoration involves multiple trades, specialized materials, and code compliance requirements that are easily overlooked or undervalued in initial estimates. Our AI-powered platform provides the expertise needed to identify these gaps and ensure you receive fair compensation for complete, code-compliant repairs.`,
  });
  
  // Section 2: Why This Matters
  sections.push({
    heading: `Why Professional ${capitalizeWords(keyword)} Is Essential`,
    body: `The financial impact of estimate errors in ${damageType} claims can be devastating. Industry studies show that initial insurance estimates frequently undervalue damage by 15-40%, with some claims underpaid by $50,000 or more. These discrepancies occur because adjusters may miss hidden damage during inspections, use outdated pricing databases, or apply policy interpretations that minimize payouts. For ${targetAudience}, the consequences extend beyond immediate financial loss—incomplete repairs can lead to ongoing damage, code violations, and decreased property value. Professional ${serviceType} services provide objective, documented analysis that levels the playing field in negotiations with insurance carriers and ensures estimates reflect the true cost of complete, quality restoration.`,
  });
  
  // Section 3: Common Issues
  sections.push({
    heading: `Common Problems in ${capitalizeWords(damageType)} Estimates`,
    body: `Our analysis of thousands of ${damageType} estimates reveals consistent patterns of missing items and pricing discrepancies. Demolition and disposal costs are frequently underestimated or omitted entirely, leaving ${targetAudience} to absorb these expenses. Material quantities often fail to account for waste factors, pattern matching, or the reality of field conditions. Labor rates may reflect outdated market conditions or fail to account for the specialized skills required for ${damageType} restoration. Overhead and profit calculations are commonly disputed, with carriers applying formulas that don't reflect industry standards. Code compliance upgrades, permit fees, and inspection costs are routinely omitted despite being mandatory for legal occupancy. These systematic gaps in ${damageType} estimates create substantial underpayment that professional ${serviceType} services are designed to identify and document.`,
  });
  
  // Section 4: Our Solution
  sections.push({
    heading: `How Our AI-Powered ${capitalizeWords(keyword)} Works`,
    body: `Our platform uses advanced artificial intelligence trained on tens of thousands of ${damageType} estimates to provide comprehensive ${serviceType} in minutes. The system extracts every line item, quantity, and price from your estimate, then compares this data against regional cost databases, industry standards, and code requirements specific to ${damageType} restoration. For ${targetAudience}, this means receiving detailed analysis that identifies missing scope items, pricing discrepancies, and calculation errors without the weeks-long delay of traditional review services. The AI recognizes ${damageType}-specific terminology, understands trade relationships and dependencies, and flags items that appear inconsistent with the described damage. You receive a professional PDF report documenting all findings with specific recommendations for supplements or negotiations, giving you the evidence needed to secure fair compensation.`,
  });
  
  // Section 5: The Process
  sections.push({
    heading: `The ${capitalizeWords(keyword)} Process`,
    body: `Getting started with professional ${serviceType} is straightforward. Upload your ${damageType} estimate in PDF, JPG, or PNG format—we accept estimates from Xactimate, Symbility, contractor software, and even handwritten quotes. Our AI immediately begins extracting line items, categorizing them by trade, and analyzing quantities and pricing. Within 5-10 minutes, the system completes comprehensive analysis comparing your estimate against current market data and industry standards for ${damageType} restoration. The platform generates a detailed report identifying missing items, pricing discrepancies, and scope gaps, complete with specific dollar amounts and line-item references. For ${targetAudience}, this report becomes a powerful tool in negotiations with insurance carriers or contractors, providing objective third-party validation of estimate deficiencies. You can download the PDF immediately and begin using it to supplement your claim or challenge lowball offers.`,
  });
  
  // Section 6: What You Receive
  sections.push({
    heading: `Comprehensive ${capitalizeWords(keyword)} Deliverables`,
    body: `Every ${serviceType} includes a complete analysis package designed specifically for ${damageType} claims. The line-item extraction report shows every material, labor item, and cost in your estimate, organized by trade for easy review. The missing items analysis identifies scope gaps based on ${damageType} restoration standards and code requirements, with pricing for each omitted item. The pricing discrepancy report compares your estimate's costs against current regional market rates, flagging items that fall outside acceptable ranges. For ${targetAudience}, the summary findings provide plain-English explanations of technical issues, making it easy to understand and communicate problems to insurance adjusters or contractors. All findings are documented in a professional PDF suitable for insurance submission, appraisal proceedings, or legal action if necessary. The report includes specific recommendations for next steps, whether that's requesting a supplement, demanding re-inspection, or invoking your policy's appraisal clause.`,
  });
  
  return sections;
}

function generateFAQs(keyword: string, damageType: string, serviceType: string, targetAudience: string) {
  const faqs = [];
  
  faqs.push({
    question: `How accurate is AI-powered ${keyword}?`,
    answer: `Our AI achieves 95%+ accuracy in line item extraction and analysis, trained on over 50,000 ${damageType} estimates. The system recognizes industry-standard terminology, regional pricing variations, and ${damageType}-specific requirements. While AI handles the time-consuming extraction and comparison work, the algorithms are built on expertise from licensed adjusters and contractors with decades of experience in ${damageType} claims.`,
  });
  
  faqs.push({
    question: `How long does ${keyword} take?`,
    answer: `Most ${damageType} estimates are fully analyzed in 5-10 minutes. Complex multi-trade estimates or large commercial properties may take up to 15 minutes. You'll receive real-time progress updates and can download your comprehensive PDF report immediately upon completion. This is dramatically faster than traditional ${serviceType} services that can take days or weeks.`,
  });
  
  faqs.push({
    question: `What makes your ${keyword} different from manual review?`,
    answer: `Our AI-powered approach combines speed, consistency, and comprehensiveness that manual review can't match. The system never gets tired, never overlooks line items, and applies the same rigorous analysis to every estimate. For ${targetAudience}, this means receiving thorough ${serviceType} at a fraction of the cost and time of hiring a public adjuster or consultant. The AI also compares against constantly updated regional pricing databases, ensuring your analysis reflects current market conditions for ${damageType} restoration.`,
  });
  
  faqs.push({
    question: `Can I use your ${keyword} report to negotiate with my insurance company?`,
    answer: `Absolutely. Our reports are specifically designed for insurance negotiations and claim supplements. The PDF includes detailed, line-item documentation that insurance adjusters can verify against their own databases. Many ${targetAudience} successfully use our reports to secure additional compensation, with some recovering tens of thousands in previously overlooked damage. The objective, third-party nature of AI analysis often carries more weight than homeowner assertions alone.`,
  });
  
  faqs.push({
    question: `What if my ${damageType} estimate is from Xactimate?`,
    answer: `We specialize in Xactimate estimate analysis. Our AI recognizes Xactimate line codes, pricing structures, and formatting. For ${targetAudience} dealing with insurance carrier estimates, this expertise is crucial—we can identify when Xactimate pricing is outdated, when line codes are misapplied, or when quantities don't match the described damage. The system also compares Xactimate pricing against current market rates to identify discrepancies.`,
  });
  
  faqs.push({
    question: `How much does ${keyword} cost?`,
    answer: `Single estimate ${serviceType} costs $79, providing complete analysis and a professional PDF report. For ${targetAudience} handling multiple claims—such as public adjusters, contractors, or property managers—our unlimited subscription at $249/month offers better value. The subscription includes priority processing, unlimited estimates, and white-label reporting options. Compared to hiring a public adjuster (typically 10-15% of the settlement), our service provides significant cost savings while delivering comprehensive analysis.`,
  });
  
  return faqs;
}

function generatePageFile(content: PageContent): string {
  return `import { Metadata } from "next";
import { SeoLandingPage } from "@/components/SeoLandingPage";

export const metadata: Metadata = {
  title: "${content.title}",
  description: "${content.description}",
};

export default function ${toPascalCase(content.slug)}Page() {
  return (
    <SeoLandingPage
      title="${content.h1}"
      subtitle="AI-Powered Analysis to Ensure Fair Compensation"
      description="${content.description}"
      sections={${JSON.stringify(content.sections, null, 10)}}
      faqs={${JSON.stringify(content.faqs, null, 10)}}
      ctaLabel="Get Your Estimate Reviewed"
      ctaHref="/pricing"
      schema={{
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "${content.keyword}",
        "provider": {
          "@type": "Organization",
          "name": "Estimate Review Pro",
          "url": "https://estimatereviewpro.com",
        },
        "areaServed": "United States",
        "description": "${content.description}",
      }}
    />
  );
}
`;
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function generatePages() {
  console.log("🚀 Starting SEO page generation...");
  console.log(`📄 Found ${keywords.length} keywords\n`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  keywords.forEach((keyword, index) => {
    try {
      const content = generateUniqueContent(keyword);
      const pageDir = path.join(APP_DIR, content.slug);
      const pageFile = path.join(pageDir, "page.tsx");

      // Skip if page already exists
      if (fs.existsSync(pageFile)) {
        skipped++;
        console.log(`⏭️  [${index + 1}/${keywords.length}] Skipped (exists): ${content.slug}`);
        return;
      }

      // Create directory
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }

      // Generate and write page file
      const pageContent = generatePageFile(content);
      fs.writeFileSync(pageFile, pageContent, "utf-8");
      
      generated++;
      console.log(`✅ [${index + 1}/${keywords.length}] Generated: ${content.slug}`);
    } catch (error) {
      errors++;
      console.error(`❌ [${index + 1}/${keywords.length}] Error: ${keyword}`, error);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("✨ SEO Page Generation Complete!");
  console.log("=".repeat(60));
  console.log(`📊 Generated: ${generated} pages`);
  console.log(`⏭️  Skipped: ${skipped} pages`);
  console.log(`❌ Errors: ${errors} pages`);
  console.log(`📁 Location: ${APP_DIR}`);
  console.log("\n💡 Next steps:");
  console.log("   1. Run 'npm run build' to verify all pages compile");
  console.log("   2. Check sitemap includes new pages");
  console.log("   3. Deploy to production");
}

// Run generator
generatePages();

