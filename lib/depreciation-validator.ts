/**
 * DEPRECIATION VALIDATION ENGINE
 * Detects excessive and improper depreciation
 * Validates against industry standards and identifies non-depreciable items
 */

export interface DepreciationLimits {
  max: number;
  typical: number;
  lifespan: number;
  perYear: number;
}

export interface DepreciationIssue {
  lineNumber: number;
  description: string;
  depreciationApplied: number;
  depreciationPercentage: number;
  maxAllowed: number;
  typicalRange: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  issue: string;
  impact: number;
}

export interface DepreciationAnalysis {
  totalDepreciation: number;
  excessiveDepreciation: DepreciationIssue[];
  improperDepreciation: DepreciationIssue[];
  recoverableWithOP: number;
  depreciationScore: number; // 0-100
  totalImpact: number;
}

/**
 * Depreciation limits by material/component type
 */
const DEPRECIATION_LIMITS: Record<string, DepreciationLimits> = {
  // Roofing
  'Asphalt Shingles': { max: 50, typical: 25, lifespan: 20, perYear: 5 },
  'Metal Roofing': { max: 30, typical: 15, lifespan: 40, perYear: 2.5 },
  'Tile Roofing': { max: 25, typical: 10, lifespan: 50, perYear: 2 },
  'Flat Roof': { max: 60, typical: 40, lifespan: 15, perYear: 6.7 },
  
  // Interior
  'Drywall': { max: 25, typical: 10, lifespan: 30, perYear: 3.3 },
  'Paint - Interior': { max: 40, typical: 20, lifespan: 10, perYear: 10 },
  'Paint - Exterior': { max: 50, typical: 30, lifespan: 7, perYear: 14 },
  
  // Flooring
  'Carpet': { max: 80, typical: 50, lifespan: 7, perYear: 14 },
  'Hardwood Flooring': { max: 40, typical: 20, lifespan: 25, perYear: 4 },
  'Tile Flooring': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  'Vinyl Flooring': { max: 60, typical: 40, lifespan: 10, perYear: 10 },
  'Laminate Flooring': { max: 50, typical: 30, lifespan: 15, perYear: 6.7 },
  
  // Mechanical
  'HVAC System': { max: 60, typical: 40, lifespan: 15, perYear: 6.7 },
  'Water Heater': { max: 70, typical: 50, lifespan: 10, perYear: 10 },
  'Plumbing Fixtures': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  
  // Structural
  'Framing': { max: 20, typical: 5, lifespan: 100, perYear: 1 },
  'Foundation': { max: 15, typical: 5, lifespan: 100, perYear: 1 },
  'Windows': { max: 40, typical: 25, lifespan: 20, perYear: 5 },
  'Doors': { max: 40, typical: 25, lifespan: 20, perYear: 5 },
  'Siding': { max: 40, typical: 25, lifespan: 20, perYear: 5 },
  
  // Cabinets & Counters
  'Cabinets': { max: 40, typical: 20, lifespan: 25, perYear: 4 },
  'Countertops - Laminate': { max: 50, typical: 30, lifespan: 15, perYear: 6.7 },
  'Countertops - Granite': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  'Countertops - Quartz': { max: 25, typical: 10, lifespan: 40, perYear: 2.5 },
  
  // Trim & Finishes
  'Trim': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  'Baseboards': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  'Crown Molding': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  
  // Insulation
  'Insulation': { max: 25, typical: 10, lifespan: 40, perYear: 2.5 },
};

/**
 * Non-depreciable items (labor, permits, etc.)
 */
const NON_DEPRECIABLE = [
  'Labor',
  'Installation',
  'Permits',
  'Inspections',
  'Overhead & Profit',
  'Overhead',
  'Profit',
  'O&P',
  'Demolition',
  'Disposal',
  'Dumpster',
  'Haul Away',
  'Drying Equipment',
  'Dehumidification',
  'Air Mover',
  'Cleaning',
  'Sanitizing',
  'Antimicrobial',
  'Detach & Reset',
  'Protection',
  'Temporary',
  'Supervision',
  'General Conditions',
];

/**
 * Main depreciation validation function
 */
export function validateDepreciation(
  lineItems: Array<{
    lineNumber: number;
    description: string;
    rcv: number;
    acv: number;
    quantity: number;
    unit: string;
  }>
): DepreciationAnalysis {
  
  console.log(`[DEPRECIATION] Validating ${lineItems.length} line items...`);
  
  const excessiveDepreciation: DepreciationIssue[] = [];
  const improperDepreciation: DepreciationIssue[] = [];
  let totalDepreciation = 0;
  let recoverableWithOP = 0;
  let totalImpact = 0;
  
  for (const item of lineItems) {
    const depreciation = item.rcv - item.acv;
    const depreciationPercentage = item.rcv > 0 ? (depreciation / item.rcv) * 100 : 0;
    totalDepreciation += depreciation;
    
    // Check if item is non-depreciable
    const isNonDepreciable = NON_DEPRECIABLE.some(keyword => 
      item.description.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isNonDepreciable && depreciation > 0) {
      const impact = depreciation;
      totalImpact += impact;
      
      improperDepreciation.push({
        lineNumber: item.lineNumber,
        description: item.description,
        depreciationApplied: depreciation,
        depreciationPercentage,
        maxAllowed: 0,
        typicalRange: 0,
        severity: 'CRITICAL',
        issue: 'Depreciation applied to non-depreciable item',
        impact,
      });
      
      console.log(`[DEPRECIATION] CRITICAL: Non-depreciable item has depreciation - Line ${item.lineNumber}`);
      continue;
    }
    
    // Look up depreciation limits
    const limits = findDepreciationLimits(item.description);
    
    if (limits && depreciation > 0) {
      // Check if depreciation exceeds maximum
      if (depreciationPercentage > limits.max) {
        const impact = ((depreciationPercentage - limits.max) / 100) * item.rcv;
        totalImpact += impact;
        
        excessiveDepreciation.push({
          lineNumber: item.lineNumber,
          description: item.description,
          depreciationApplied: depreciation,
          depreciationPercentage,
          maxAllowed: limits.max,
          typicalRange: limits.typical,
          severity: depreciationPercentage > limits.max * 1.5 ? 'CRITICAL' : 'HIGH',
          issue: `Depreciation ${depreciationPercentage.toFixed(1)}% exceeds maximum ${limits.max}%`,
          impact,
        });
        
        console.log(`[DEPRECIATION] Excessive depreciation detected - Line ${item.lineNumber}: ${depreciationPercentage.toFixed(1)}% (max: ${limits.max}%)`);
      }
    }
    
    // Calculate recoverable depreciation with O&P (20%)
    if (depreciation > 0) {
      recoverableWithOP += depreciation * 1.20;
    }
  }
  
  // Calculate depreciation score (0-100)
  // Higher score = better (less issues)
  const depreciationScore = calculateDepreciationScore(
    excessiveDepreciation,
    improperDepreciation,
    totalDepreciation,
    lineItems.reduce((sum, item) => sum + item.rcv, 0)
  );
  
  console.log(`[DEPRECIATION] Validation complete:`);
  console.log(`[DEPRECIATION] - Total depreciation: $${totalDepreciation.toFixed(2)}`);
  console.log(`[DEPRECIATION] - Excessive depreciation: ${excessiveDepreciation.length} items`);
  console.log(`[DEPRECIATION] - Improper depreciation: ${improperDepreciation.length} items`);
  console.log(`[DEPRECIATION] - Total impact: $${totalImpact.toFixed(2)}`);
  console.log(`[DEPRECIATION] - Depreciation score: ${depreciationScore}/100`);
  
  return {
    totalDepreciation,
    excessiveDepreciation,
    improperDepreciation,
    recoverableWithOP,
    depreciationScore,
    totalImpact,
  };
}

/**
 * Find depreciation limits for a line item
 */
function findDepreciationLimits(description: string): DepreciationLimits | null {
  const descLower = description.toLowerCase();
  
  // Try exact match first
  for (const [material, limits] of Object.entries(DEPRECIATION_LIMITS)) {
    if (descLower.includes(material.toLowerCase())) {
      return limits;
    }
  }
  
  // Try fuzzy match
  if (descLower.includes('roof') || descLower.includes('shingle')) {
    return DEPRECIATION_LIMITS['Asphalt Shingles'];
  }
  if (descLower.includes('drywall') || descLower.includes('sheetrock')) {
    return DEPRECIATION_LIMITS['Drywall'];
  }
  if (descLower.includes('paint')) {
    if (descLower.includes('exterior') || descLower.includes('outside')) {
      return DEPRECIATION_LIMITS['Paint - Exterior'];
    }
    return DEPRECIATION_LIMITS['Paint - Interior'];
  }
  if (descLower.includes('carpet')) {
    return DEPRECIATION_LIMITS['Carpet'];
  }
  if (descLower.includes('hardwood') || descLower.includes('wood floor')) {
    return DEPRECIATION_LIMITS['Hardwood Flooring'];
  }
  if (descLower.includes('tile') && descLower.includes('floor')) {
    return DEPRECIATION_LIMITS['Tile Flooring'];
  }
  if (descLower.includes('vinyl') && descLower.includes('floor')) {
    return DEPRECIATION_LIMITS['Vinyl Flooring'];
  }
  if (descLower.includes('laminate') && descLower.includes('floor')) {
    return DEPRECIATION_LIMITS['Laminate Flooring'];
  }
  if (descLower.includes('hvac') || descLower.includes('air condition') || descLower.includes('furnace')) {
    return DEPRECIATION_LIMITS['HVAC System'];
  }
  if (descLower.includes('water heater')) {
    return DEPRECIATION_LIMITS['Water Heater'];
  }
  if (descLower.includes('cabinet')) {
    return DEPRECIATION_LIMITS['Cabinets'];
  }
  if (descLower.includes('counter')) {
    if (descLower.includes('granite')) return DEPRECIATION_LIMITS['Countertops - Granite'];
    if (descLower.includes('quartz')) return DEPRECIATION_LIMITS['Countertops - Quartz'];
    return DEPRECIATION_LIMITS['Countertops - Laminate'];
  }
  if (descLower.includes('window')) {
    return DEPRECIATION_LIMITS['Windows'];
  }
  if (descLower.includes('door')) {
    return DEPRECIATION_LIMITS['Doors'];
  }
  if (descLower.includes('siding')) {
    return DEPRECIATION_LIMITS['Siding'];
  }
  if (descLower.includes('trim') || descLower.includes('baseboard') || descLower.includes('molding')) {
    return DEPRECIATION_LIMITS['Trim'];
  }
  if (descLower.includes('insulation')) {
    return DEPRECIATION_LIMITS['Insulation'];
  }
  if (descLower.includes('frame') || descLower.includes('framing')) {
    return DEPRECIATION_LIMITS['Framing'];
  }
  
  return null;
}

/**
 * Calculate depreciation score (0-100)
 */
function calculateDepreciationScore(
  excessiveDepreciation: DepreciationIssue[],
  improperDepreciation: DepreciationIssue[],
  totalDepreciation: number,
  totalRCV: number
): number {
  
  let score = 100;
  
  // Deduct for improper depreciation (critical)
  score -= improperDepreciation.length * 15;
  
  // Deduct for excessive depreciation
  score -= excessiveDepreciation.filter(d => d.severity === 'CRITICAL').length * 10;
  score -= excessiveDepreciation.filter(d => d.severity === 'HIGH').length * 5;
  
  // Deduct for high overall depreciation percentage
  const depreciationPercentage = totalRCV > 0 ? (totalDepreciation / totalRCV) * 100 : 0;
  if (depreciationPercentage > 50) {
    score -= 10;
  } else if (depreciationPercentage > 40) {
    score -= 5;
  }
  
  return Math.max(0, score);
}

/**
 * Generate depreciation validation summary
 */
export function generateDepreciationSummary(result: DepreciationAnalysis): string {
  let summary = `DEPRECIATION VALIDATION SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `OVERALL ANALYSIS:\n`;
  summary += `- Total depreciation: $${result.totalDepreciation.toFixed(2)}\n`;
  summary += `- Recoverable with O&P: $${result.recoverableWithOP.toFixed(2)}\n`;
  summary += `- Total impact: $${result.totalImpact.toFixed(2)}\n`;
  summary += `- Depreciation score: ${result.depreciationScore}/100\n\n`;
  
  if (result.improperDepreciation.length > 0) {
    summary += `IMPROPER DEPRECIATION (${result.improperDepreciation.length} items):\n`;
    summary += `These items should NOT have depreciation applied:\n\n`;
    
    for (const issue of result.improperDepreciation) {
      summary += `- Line ${issue.lineNumber}: ${issue.description}\n`;
      summary += `  Depreciation: $${issue.depreciationApplied.toFixed(2)} (${issue.depreciationPercentage.toFixed(1)}%)\n`;
      summary += `  Issue: ${issue.issue}\n`;
      summary += `  Impact: $${issue.impact.toFixed(2)}\n`;
      summary += `  Severity: ${issue.severity}\n\n`;
    }
  }
  
  if (result.excessiveDepreciation.length > 0) {
    summary += `EXCESSIVE DEPRECIATION (${result.excessiveDepreciation.length} items):\n`;
    summary += `These items have depreciation exceeding industry standards:\n\n`;
    
    for (const issue of result.excessiveDepreciation.slice(0, 10)) {
      summary += `- Line ${issue.lineNumber}: ${issue.description}\n`;
      summary += `  Depreciation: $${issue.depreciationApplied.toFixed(2)} (${issue.depreciationPercentage.toFixed(1)}%)\n`;
      summary += `  Maximum allowed: ${issue.maxAllowed}%\n`;
      summary += `  Typical range: ${issue.typicalRange}%\n`;
      summary += `  Impact: $${issue.impact.toFixed(2)}\n`;
      summary += `  Severity: ${issue.severity}\n\n`;
    }
    
    if (result.excessiveDepreciation.length > 10) {
      summary += `... and ${result.excessiveDepreciation.length - 10} more\n\n`;
    }
  }
  
  if (result.improperDepreciation.length === 0 && result.excessiveDepreciation.length === 0) {
    summary += `✓ No depreciation issues detected\n`;
    summary += `All depreciation appears to be within industry standards.\n`;
  }
  
  return summary;
}

/**
 * Get depreciation limits for a material type
 */
export function getDepreciationLimits(materialType: string): DepreciationLimits | null {
  return DEPRECIATION_LIMITS[materialType] || null;
}

/**
 * Check if item is non-depreciable
 */
export function isNonDepreciable(description: string): boolean {
  const descLower = description.toLowerCase();
  return NON_DEPRECIABLE.some(keyword => descLower.includes(keyword.toLowerCase()));
}

/**
 * Get all material types with depreciation limits
 */
export function getAllMaterialTypes(): string[] {
  return Object.keys(DEPRECIATION_LIMITS);
}
