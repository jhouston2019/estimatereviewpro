export interface SeoContent {
  keyword: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: {
    heading: string;
    body: string;
    bullets?: string[];
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  relatedPages: string[];
}

export function generateSeoContent(keyword: string): SeoContent {
  const slug = keyword.toLowerCase().replace(/\s+/g, "-");
  
  // Extract key terms for content generation
  const terms = keyword.split(" ");
  const damageType = extractDamageType(keyword);
  const serviceType = extractServiceType(keyword);
  
  return {
    keyword,
    slug,
    title: `${capitalizeWords(keyword)} | AI-Powered Analysis | Estimate Review Pro`,
    metaDescription: `Professional ${keyword} service. AI-powered analysis identifies missing items, pricing discrepancies, and scope gaps to maximize your insurance claim settlement.`,
    h1: capitalizeWords(keyword),
    intro: generateIntro(keyword, damageType, serviceType),
    sections: generateSections(keyword, damageType, serviceType),
    faqs: generateFaqs(keyword, damageType, serviceType),
    relatedPages: generateRelatedPages(keyword, damageType),
  };
}

function extractDamageType(keyword: string): string {
  const damageTypes = [
    "roof", "fire", "water", "hail", "wind", "flood", "smoke", "mold",
    "tree", "tornado", "hurricane", "freeze", "foundation", "structural",
    "bathroom", "kitchen", "garage", "attic", "basement", "exterior",
    "window", "siding", "stucco", "flooring", "drywall"
  ];
  
  for (const type of damageTypes) {
    if (keyword.includes(type)) {
      return type;
    }
  }
  return "property";
}

function extractServiceType(keyword: string): string {
  if (keyword.includes("review") || keyword.includes("audit")) return "review";
  if (keyword.includes("dispute") || keyword.includes("too low")) return "dispute";
  if (keyword.includes("supplement")) return "supplement";
  if (keyword.includes("second opinion")) return "second-opinion";
  if (keyword.includes("missing items")) return "missing-items";
  if (keyword.includes("underpayment")) return "underpayment";
  if (keyword.includes("help") || keyword.includes("clarification")) return "help";
  return "analysis";
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateIntro(keyword: string, damageType: string, serviceType: string): string {
  const templates = {
    review: `When dealing with ${damageType} damage, accurate estimates are critical to receiving fair compensation. Our AI-powered platform analyzes your ${keyword} in minutes, identifying missing items, pricing discrepancies, and scope gaps that could cost you thousands in lost compensation.`,
    dispute: `Disputing insurance estimates requires detailed documentation and objective analysis. Our AI platform provides comprehensive ${keyword} services, building a documented case with line-by-line analysis that strengthens your negotiation position and maximizes your settlement.`,
    supplement: `Discovered additional damage during repairs? Our AI analyzes your ${keyword} against the original claim, documenting new findings and building a defensible case for additional compensation that insurance carriers will accept.`,
    "missing-items": `Insurance estimates routinely omit necessary work and materials. Our AI identifies missing items in your ${damageType} estimate that you may not know to look for, documenting everything needed for complete, code-compliant repairs.`,
    underpayment: `Insurance underpayment is widespread in ${damageType} claims. Our AI analyzes your estimate to identify underpayments, missing items, and pricing discrepancies, building a documented case to recover the compensation you deserve.`,
    help: `Navigating ${damageType} insurance claims is overwhelming. Our AI provides expert ${keyword} services, translating complex estimates into plain English and identifying discrepancies that strengthen your claim.`,
    default: `Professional ${keyword} services using AI-powered analysis. We identify missing items, pricing discrepancies, and scope gaps in ${damageType} estimates to ensure you receive fair compensation for your property damage claim.`,
  };
  
  return templates[serviceType as keyof typeof templates] || templates.default;
}

function generateSections(keyword: string, damageType: string, serviceType: string): SeoContent["sections"] {
  return [
    {
      heading: `Why ${capitalizeWords(keyword)} Is Essential`,
      body: `${capitalizeWords(damageType)} damage claims involve complex estimates with hundreds of line items across multiple trades. Insurance carriers and contractors may inadvertently omit items, use outdated pricing, or misinterpret the scope of necessary repairs. Professional ${keyword} ensures nothing is missed and pricing is fair.`,
      bullets: [
        `Hidden damage not visible during initial inspection`,
        `Missing materials and labor items in estimates`,
        `Outdated pricing that doesn't reflect current market rates`,
        `Inadequate quantities based on visual inspection`,
        `Omitted code compliance and permit requirements`,
        `Missing overhead and profit on complex repairs`,
      ],
    },
    {
      heading: `Common Issues Found in ${capitalizeWords(damageType)} Estimates`,
      body: `Our AI analysis of thousands of ${damageType} estimates reveals consistent patterns of missing items and pricing discrepancies:`,
      bullets: [
        `Inadequate demolition and disposal allowances`,
        `Missing preparatory work and surface preparation`,
        `Underestimated material quantities and waste factors`,
        `Omitted specialty equipment and rental costs`,
        `Missing temporary protection and cleanup items`,
        `Inadequate allowances for matching existing finishes`,
      ],
    },
    {
      heading: `Our AI-Powered Analysis Process`,
      body: `Upload your ${damageType} estimate and our AI performs comprehensive analysis in minutes:`,
      bullets: [
        `Complete extraction of all line items, quantities, and pricing`,
        `Comparison against regional cost databases and industry standards`,
        `Identification of missing scope items based on damage type`,
        `Pricing analysis flagging undervalued materials and labor`,
        `Professional PDF report with detailed findings`,
        `Plain-English summary suitable for insurance negotiations`,
      ],
    },
    {
      heading: `What You Receive`,
      body: `Every ${keyword} includes comprehensive documentation to support your claim:`,
      bullets: [
        `Complete line-item extraction and categorization`,
        `Missing items report with descriptions and pricing`,
        `Pricing discrepancy analysis with market comparisons`,
        `Scope gap identification showing incomplete descriptions`,
        `Professional PDF report suitable for insurance submission`,
        `Recommended next steps for claim negotiation`,
      ],
    },
    {
      heading: `Who Benefits from ${capitalizeWords(keyword)}`,
      body: `Our ${keyword} services help multiple stakeholders ensure accurate, complete estimates:`,
      bullets: [
        `Homeowners verifying insurance and contractor estimates`,
        `Public adjusters building stronger claims with documented analysis`,
        `Contractors validating their estimates before submission`,
        `Property managers overseeing multiple repair projects`,
        `Legal professionals supporting property damage litigation`,
      ],
    },
  ];
}

function generateFaqs(keyword: string, damageType: string, serviceType: string): SeoContent["faqs"] {
  return [
    {
      question: `How accurate is AI ${keyword}?`,
      answer: `Our AI achieves 95%+ accuracy in line item extraction and has been trained on thousands of ${damageType} estimates. The system recognizes industry terminology, regional pricing variations, and damage-specific requirements.`,
    },
    {
      question: `How long does ${keyword} take?`,
      answer: `Most ${damageType} estimates are analyzed in under 5 minutes. Complex multi-trade estimates may take up to 10 minutes. You'll receive real-time status updates as the AI processes your estimate.`,
    },
    {
      question: `What file formats do you accept?`,
      answer: `We accept PDF, PNG, and JPG files up to 10MB. This includes estimates from Xactimate, Symbility, contractor software, handwritten quotes, and scanned documents.`,
    },
    {
      question: `Can you compare my contractor estimate to the insurance estimate?`,
      answer: `Yes! Upload both estimates and our AI performs line-by-line comparison, identifying missing items, pricing discrepancies, and scope differences. This comparison is invaluable for negotiating with insurance adjusters.`,
    },
    {
      question: `How much does ${keyword} cost?`,
      answer: `Single estimate reviews are $79. For public adjusters, contractors, or property managers handling multiple claims, our unlimited subscription at $249/month provides better value with priority processing.`,
    },
  ];
}

function generateRelatedPages(keyword: string, damageType: string): string[] {
  const related = [
    "/pricing",
    "/how-it-works",
    "/contractor-estimate-review",
    "/insurance-estimate-review",
  ];
  
  // Add damage-type specific pages
  if (damageType === "roof") related.push("/roof-estimate-review");
  if (damageType === "water") related.push("/water-estimate-review");
  if (damageType === "fire") related.push("/fire-estimate-review");
  if (damageType === "mold") related.push("/mold-estimate-review");
  
  return related;
}

