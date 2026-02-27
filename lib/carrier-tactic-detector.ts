/**
 * CARRIER TACTIC DETECTION ENGINE
 * Detects 10 common carrier underpayment tactics
 * Calculates financial impact and provides counter-arguments
 */

export interface CarrierTactic {
  tactic: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  estimatedImpact: number;
  evidence: string[];
  counterArgument: string;
  lineItemsAffected: number[];
}

export interface CarrierTacticsAnalysis {
  tacticsDetected: CarrierTactic[];
  totalImpact: number;
  severityScore: number; // 0-100
  recommendations: string[];
}

export interface EstimateForTacticDetection {
  lineItems: Array<{
    lineNumber: number;
    tradeCode: string;
    description: string;
    quantity: number;
    unit: string;
    rcv: number;
    acv: number;
    depreciation: number;
    actionType?: string;
  }>;
  codeUpgradeFlags?: Array<{ code: string; missing: boolean }>;
  pricingAnalysis?: { underpriced: any[] };
  depreciationAnalysis?: { excessiveDepreciation: any[]; improperDepreciation: any[] };
  laborAnalysis?: { undervaluedLabor: any[] };
}

/**
 * Main carrier tactic detection function
 */
export function detectCarrierTactics(estimate: EstimateForTacticDetection): CarrierTacticsAnalysis {
  console.log(`[CARRIER-TACTICS] Analyzing estimate for carrier tactics...`);
  
  const tacticsDetected: CarrierTactic[] = [];
  let totalImpact = 0;
  
  // TACTIC 1: Depreciation Stacking
  const depreciationStacking = detectDepreciationStacking(estimate);
  if (depreciationStacking) {
    tacticsDetected.push(depreciationStacking);
    totalImpact += depreciationStacking.estimatedImpact;
  }
  
  // TACTIC 2: Missing O&P on Recoverable Depreciation
  const missingOP = detectMissingOPOnRecoverable(estimate);
  if (missingOP) {
    tacticsDetected.push(missingOP);
    totalImpact += missingOP.estimatedImpact;
  }
  
  // TACTIC 3: Labor-Only Line Items
  const laborOnly = detectLaborOnlyItems(estimate);
  if (laborOnly) {
    tacticsDetected.push(laborOnly);
    totalImpact += laborOnly.estimatedImpact;
  }
  
  // TACTIC 4: Material-Only Line Items
  const materialOnly = detectMaterialOnlyItems(estimate);
  if (materialOnly) {
    tacticsDetected.push(materialOnly);
    totalImpact += materialOnly.estimatedImpact;
  }
  
  // TACTIC 5: Partial Scope / Incomplete Repairs
  const partialScope = detectPartialScope(estimate);
  if (partialScope) {
    tacticsDetected.push(partialScope);
    totalImpact += partialScope.estimatedImpact;
  }
  
  // TACTIC 6: Excessive Betterment Deductions
  const betterment = detectBettermentDeductions(estimate);
  if (betterment) {
    tacticsDetected.push(betterment);
    totalImpact += betterment.estimatedImpact;
  }
  
  // TACTIC 7: Code Upgrade Omissions
  const codeOmissions = detectCodeUpgradeOmissions(estimate);
  if (codeOmissions) {
    tacticsDetected.push(codeOmissions);
    totalImpact += codeOmissions.estimatedImpact;
  }
  
  // TACTIC 8: Matching Existing / Forced Partial Repairs
  const matchingExisting = detectMatchingExisting(estimate);
  if (matchingExisting) {
    tacticsDetected.push(matchingExisting);
    totalImpact += matchingExisting.estimatedImpact;
  }
  
  // TACTIC 9: Cosmetic Damage Exclusions
  const cosmeticExclusions = detectCosmeticExclusions(estimate);
  if (cosmeticExclusions) {
    tacticsDetected.push(cosmeticExclusions);
    totalImpact += cosmeticExclusions.estimatedImpact;
  }
  
  // TACTIC 10: Functional Obsolescence Deductions
  const obsolescence = detectFunctionalObsolescence(estimate);
  if (obsolescence) {
    tacticsDetected.push(obsolescence);
    totalImpact += obsolescence.estimatedImpact;
  }
  
  // Calculate severity score
  const severityScore = calculateSeverityScore(tacticsDetected, totalImpact);
  
  // Generate recommendations
  const recommendations = generateRecommendations(tacticsDetected);
  
  console.log(`[CARRIER-TACTICS] Detection complete:`);
  console.log(`[CARRIER-TACTICS] - Tactics detected: ${tacticsDetected.length}`);
  console.log(`[CARRIER-TACTICS] - Total impact: $${totalImpact.toFixed(2)}`);
  console.log(`[CARRIER-TACTICS] - Severity score: ${severityScore}/100`);
  
  return {
    tacticsDetected,
    totalImpact,
    severityScore,
    recommendations,
  };
}

/**
 * TACTIC 1: Depreciation Stacking
 */
function detectDepreciationStacking(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  // Check if depreciation applied to both material and labor on same item
  for (const item of estimate.lineItems) {
    const isLabor = /labor|installation|install/i.test(item.description);
    const hasDepreciation = item.depreciation > 0;
    
    if (isLabor && hasDepreciation) {
      evidence.push(`Line ${item.lineNumber}: Labor item "${item.description}" has depreciation of $${item.depreciation.toFixed(2)}`);
      affectedItems.push(item.lineNumber);
      impact += item.depreciation;
    }
  }
  
  // Also check if improper depreciation was detected
  if (estimate.depreciationAnalysis?.improperDepreciation) {
    for (const issue of estimate.depreciationAnalysis.improperDepreciation) {
      if (!affectedItems.includes(issue.lineNumber)) {
        evidence.push(`Line ${issue.lineNumber}: ${issue.issue}`);
        affectedItems.push(issue.lineNumber);
        impact += issue.impact;
      }
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Depreciation Stacking',
    severity: 'CRITICAL',
    description: 'Applying depreciation multiple times or to non-depreciable items (labor, permits, etc.)',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Labor is not depreciable. Only materials depreciate over time. Applying depreciation to labor or applying it multiple times is improper and violates standard insurance practices. Labor costs are based on current market rates regardless of the age of the materials being replaced.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 2: Missing O&P on Recoverable Depreciation
 */
function detectMissingOPOnRecoverable(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  
  // Calculate total recoverable depreciation
  let totalRecoverable = 0;
  for (const item of estimate.lineItems) {
    if (item.depreciation > 0) {
      totalRecoverable += item.depreciation;
      affectedItems.push(item.lineNumber);
    }
  }
  
  if (totalRecoverable === 0) return null;
  
  // Check if O&P line item exists
  const hasOP = estimate.lineItems.some(item => 
    /overhead|profit|o&p|o & p/i.test(item.description)
  );
  
  if (hasOP) return null; // O&P is present
  
  // Calculate impact (20% O&P on recoverable depreciation)
  const impact = totalRecoverable * 0.20;
  
  evidence.push(`Total recoverable depreciation: $${totalRecoverable.toFixed(2)}`);
  evidence.push(`Missing O&P (20%): $${impact.toFixed(2)}`);
  evidence.push(`No overhead & profit line item found in estimate`);
  
  return {
    tactic: 'Missing O&P on Recoverable Depreciation',
    severity: 'HIGH',
    description: 'Not including overhead & profit on recoverable depreciation',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Overhead and profit should be applied to recoverable depreciation. This is standard industry practice and required for proper restoration. When depreciation is recovered upon completion of repairs, it should include the contractor\'s overhead and profit, typically 10% overhead + 10% profit = 20% total.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 3: Labor-Only Line Items
 */
function detectLaborOnlyItems(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    const isLaborOnly = /labor only|installation only|install only/i.test(item.description);
    const isInstall = /install|replace/i.test(item.description);
    
    if (isLaborOnly || (isInstall && !hasCorrespondingMaterial(item, estimate.lineItems))) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - labor without materials`);
      affectedItems.push(item.lineNumber);
      
      // Estimate material cost (typically 40-60% of total job cost)
      const estimatedMaterialCost = item.rcv * 0.5;
      impact += estimatedMaterialCost;
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Labor-Only Line Items',
    severity: 'HIGH',
    description: 'Line items with labor but missing material costs',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Installation labor requires materials. Material costs must be included for complete scope of work. A complete repair includes both the materials needed and the labor to install them. Omitting materials creates an incomplete estimate that cannot be executed.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 4: Material-Only Line Items
 */
function detectMaterialOnlyItems(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    const isMaterialOnly = /material only|materials only|supply only/i.test(item.description);
    const isMaterial = /material|supply/i.test(item.description);
    
    if (isMaterialOnly || (isMaterial && !hasCorrespondingLabor(item, estimate.lineItems))) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - materials without labor`);
      affectedItems.push(item.lineNumber);
      
      // Estimate labor cost (typically 40-60% of material cost)
      const estimatedLaborCost = item.rcv * 0.5;
      impact += estimatedLaborCost;
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Material-Only Line Items',
    severity: 'HIGH',
    description: 'Line items with materials but missing labor costs',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Materials require installation labor. Labor costs must be included for complete scope of work. Materials do not install themselves. Professional installation is required for proper restoration and to maintain warranties.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 5: Partial Scope / Incomplete Repairs
 */
function detectPartialScope(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  // Check for removal without replacement
  const removals = estimate.lineItems.filter(item => 
    item.actionType === 'REMOVE' || /remove|demo|tear out/i.test(item.description)
  );
  
  const replacements = estimate.lineItems.filter(item => 
    item.actionType === 'REPLACE' || item.actionType === 'INSTALL' || /install|replace/i.test(item.description)
  );
  
  if (removals.length > replacements.length) {
    evidence.push(`${removals.length} removal items but only ${replacements.length} replacement items`);
    
    // Identify specific removals without replacements
    for (const removal of removals) {
      const hasReplacement = replacements.some(rep => 
        rep.tradeCode === removal.tradeCode &&
        Math.abs(rep.quantity - removal.quantity) < removal.quantity * 0.2
      );
      
      if (!hasReplacement) {
        evidence.push(`Line ${removal.lineNumber}: "${removal.description}" - removal without replacement`);
        affectedItems.push(removal.lineNumber);
        
        // Estimate replacement cost (typically 2-3x removal cost)
        impact += removal.rcv * 2.5;
      }
    }
  }
  
  // Check for partial/patch keywords
  for (const item of estimate.lineItems) {
    if (/partial|patch|temporary/i.test(item.description)) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - indicates incomplete repair`);
      affectedItems.push(item.lineNumber);
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Partial Scope / Incomplete Repairs',
    severity: 'CRITICAL',
    description: 'Estimate covers only partial repairs, leaving work incomplete',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Partial repairs leave the property in worse condition than before the loss. Complete restoration to pre-loss condition is required. Removing damaged materials without replacing them creates an uninhabitable condition. Insurance policies require restoration to pre-loss condition, not partial demolition.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 6: Excessive Betterment Deductions
 */
function detectBettermentDeductions(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    const isBetterment = /betterment|upgrade/i.test(item.description);
    const hasExcessiveDepreciation = item.depreciation > 0 && 
      (item.depreciation / item.rcv) > 0.5;
    
    if (isBetterment && hasExcessiveDepreciation) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - ${((item.depreciation / item.rcv) * 100).toFixed(1)}% depreciation as "betterment"`);
      affectedItems.push(item.lineNumber);
      
      // Impact is the excessive portion (over 30%)
      const excessivePortion = (item.depreciation / item.rcv) - 0.30;
      if (excessivePortion > 0) {
        impact += item.rcv * excessivePortion;
      }
    }
  }
  
  // Also check depreciation analysis
  if (estimate.depreciationAnalysis?.excessiveDepreciation) {
    for (const issue of estimate.depreciationAnalysis.excessiveDepreciation) {
      if (/betterment|upgrade/i.test(issue.description) && !affectedItems.includes(issue.lineNumber)) {
        evidence.push(`Line ${issue.lineNumber}: ${issue.issue}`);
        affectedItems.push(issue.lineNumber);
        impact += issue.impact;
      }
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Excessive Betterment Deductions',
    severity: 'HIGH',
    description: 'Excessive deductions for "upgrades" that are actually code requirements',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Code-required upgrades are not betterment. Building codes must be followed for legal occupancy. When repairs trigger code requirements, those upgrades are mandatory, not optional improvements. The policy covers repair or replacement with like kind and quality, which includes meeting current code requirements.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 7: Code Upgrade Omissions
 */
function detectCodeUpgradeOmissions(estimate: EstimateForTacticDetection): CarrierTactic | null {
  if (!estimate.codeUpgradeFlags || estimate.codeUpgradeFlags.length === 0) {
    return null;
  }
  
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  const codeImpactEstimates: Record<string, number> = {
    'AFCI': 200,
    'GFCI': 100,
    'SMOKE_DETECTOR': 75,
    'CO_DETECTOR': 60,
    'DRIP_EDGE': 500,
    'ICE_WATER_SHIELD': 800,
    'PERMIT': 500,
    'DETACH_RESET': 300,
  };
  
  for (const flag of estimate.codeUpgradeFlags) {
    if (flag.missing) {
      evidence.push(`Missing code-required item: ${flag.code}`);
      impact += codeImpactEstimates[flag.code] || 100;
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Code Upgrade Omissions',
    severity: 'CRITICAL',
    description: 'Missing code-required items (AFCI, GFCI, permits, etc.)',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Code upgrades are required by law and must be included in any repair estimate. Omitting them leaves the property in violation of building codes and potentially uninsurable. Local building codes, NEC (National Electrical Code), and IRC (International Residential Code) mandate these upgrades when repairs are performed.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 8: Matching Existing / Forced Partial Repairs
 */
function detectMatchingExisting(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    if (/match existing|match|blend/i.test(item.description)) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - forced matching may create visible lines of demarcation`);
      affectedItems.push(item.lineNumber);
      
      // Estimate cost of full area replacement (typically 2-3x partial)
      impact += item.rcv * 1.5;
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Matching Existing / Forced Partial Repairs',
    severity: 'HIGH',
    description: 'Forcing partial repairs to "match existing" instead of proper restoration',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Partial repairs often result in visible lines of demarcation and improper restoration. Complete area restoration may be required for proper matching. Materials age and fade, making exact matching impossible in many cases. Industry standards often require replacement of entire visible surfaces to avoid mismatched appearance.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 9: Cosmetic Damage Exclusions
 */
function detectCosmeticExclusions(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    const isCosmetic = /cosmetic|appearance only/i.test(item.description);
    const isZeroQuantity = item.quantity === 0;
    
    if (isCosmetic && isZeroQuantity) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - marked as cosmetic with zero quantity`);
      affectedItems.push(item.lineNumber);
      
      // Estimate based on similar items in estimate
      const similarItems = estimate.lineItems.filter(i => 
        i.tradeCode === item.tradeCode && i.quantity > 0
      );
      
      if (similarItems.length > 0) {
        const avgCost = similarItems.reduce((sum, i) => sum + i.rcv, 0) / similarItems.length;
        impact += avgCost;
      } else {
        impact += 500; // Default estimate
      }
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Cosmetic Damage Exclusions',
    severity: 'MODERATE',
    description: 'Denying visible damage as "cosmetic only"',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Visible damage affects property value and marketability. Cosmetic damage is covered under most policies. The policy typically covers direct physical loss, which includes visible damage that affects the appearance and value of the property. "Cosmetic" is not a valid exclusion in most standard homeowner policies.',
    lineItemsAffected: affectedItems,
  };
}

/**
 * TACTIC 10: Functional Obsolescence Deductions
 */
function detectFunctionalObsolescence(estimate: EstimateForTacticDetection): CarrierTactic | null {
  const evidence: string[] = [];
  const affectedItems: number[] = [];
  let impact = 0;
  
  for (const item of estimate.lineItems) {
    const isObsolescence = /obsolescence|outdated|old style/i.test(item.description);
    const hasExcessiveDepreciation = item.depreciation > 0 && 
      (item.depreciation / item.rcv) > 0.30;
    
    if (isObsolescence && hasExcessiveDepreciation) {
      evidence.push(`Line ${item.lineNumber}: "${item.description}" - ${((item.depreciation / item.rcv) * 100).toFixed(1)}% depreciation for obsolescence`);
      affectedItems.push(item.lineNumber);
      
      // Impact is the excessive portion (over 15%)
      const excessivePortion = (item.depreciation / item.rcv) - 0.15;
      if (excessivePortion > 0) {
        impact += item.rcv * excessivePortion;
      }
    }
  }
  
  if (evidence.length === 0) return null;
  
  return {
    tactic: 'Functional Obsolescence Deductions',
    severity: 'HIGH',
    description: 'Excessive deductions for "functional obsolescence"',
    estimatedImpact: impact,
    evidence,
    counterArgument: 'Functional obsolescence deductions should be minimal. The policy covers replacement with like kind and quality, not reduction for age or style. Materials that are no longer manufactured should be replaced with the closest modern equivalent at current costs, not subject to obsolescence deductions.',
    lineItemsAffected: affectedItems,
  };
}

// Helper functions

function hasCorrespondingMaterial(laborItem: any, allItems: any[]): boolean {
  const laborDesc = laborItem.description.toLowerCase();
  
  return allItems.some(item => 
    item.lineNumber !== laborItem.lineNumber &&
    item.tradeCode === laborItem.tradeCode &&
    /material|supply/i.test(item.description) &&
    Math.abs(item.quantity - laborItem.quantity) < laborItem.quantity * 0.2
  );
}

function hasCorrespondingLabor(materialItem: any, allItems: any[]): boolean {
  const materialDesc = materialItem.description.toLowerCase();
  
  return allItems.some(item => 
    item.lineNumber !== materialItem.lineNumber &&
    item.tradeCode === materialItem.tradeCode &&
    /labor|install|installation/i.test(item.description) &&
    Math.abs(item.quantity - materialItem.quantity) < materialItem.quantity * 0.2
  );
}

function calculateSeverityScore(tactics: CarrierTactic[], totalImpact: number): number {
  if (tactics.length === 0) return 0;
  
  let score = 0;
  
  // Weight by severity
  const criticalCount = tactics.filter(t => t.severity === 'CRITICAL').length;
  const highCount = tactics.filter(t => t.severity === 'HIGH').length;
  const moderateCount = tactics.filter(t => t.severity === 'MODERATE').length;
  
  score += criticalCount * 30;
  score += highCount * 20;
  score += moderateCount * 10;
  
  // Weight by financial impact
  if (totalImpact > 10000) score += 20;
  else if (totalImpact > 5000) score += 15;
  else if (totalImpact > 2000) score += 10;
  else if (totalImpact > 1000) score += 5;
  
  return Math.min(100, score);
}

function generateRecommendations(tactics: CarrierTactic[]): string[] {
  const recommendations: string[] = [];
  
  if (tactics.length === 0) {
    recommendations.push('No carrier tactics detected. Estimate appears structurally sound.');
    return recommendations;
  }
  
  recommendations.push(`${tactics.length} potential carrier tactic(s) detected requiring attention.`);
  
  const criticalTactics = tactics.filter(t => t.severity === 'CRITICAL');
  if (criticalTactics.length > 0) {
    recommendations.push(`${criticalTactics.length} CRITICAL issue(s) identified that may significantly impact claim settlement.`);
  }
  
  const highTactics = tactics.filter(t => t.severity === 'HIGH');
  if (highTactics.length > 0) {
    recommendations.push(`${highTactics.length} HIGH priority issue(s) requiring professional review.`);
  }
  
  recommendations.push('Review each tactic with supporting evidence and counter-arguments provided.');
  recommendations.push('Consider consulting with a public adjuster or attorney for claims over $50,000.');
  recommendations.push('Document all findings and maintain detailed records for claim file.');
  
  return recommendations;
}

/**
 * Generate carrier tactics summary
 */
export function generateCarrierTacticsSummary(result: CarrierTacticsAnalysis): string {
  let summary = `CARRIER TACTICS DETECTION SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `OVERALL ANALYSIS:\n`;
  summary += `- Tactics detected: ${result.tacticsDetected.length}\n`;
  summary += `- Total financial impact: $${result.totalImpact.toFixed(2)}\n`;
  summary += `- Severity score: ${result.severityScore}/100\n\n`;
  
  if (result.tacticsDetected.length === 0) {
    summary += `✓ No carrier tactics detected\n`;
    summary += `Estimate appears structurally sound with no obvious underpayment tactics.\n`;
    return summary;
  }
  
  summary += `DETECTED TACTICS:\n\n`;
  
  for (const tactic of result.tacticsDetected) {
    summary += `${tactic.severity} - ${tactic.tactic}\n`;
    summary += `Description: ${tactic.description}\n`;
    summary += `Estimated Impact: $${tactic.estimatedImpact.toFixed(2)}\n`;
    summary += `Line Items Affected: ${tactic.lineItemsAffected.length}\n\n`;
    
    summary += `Evidence:\n`;
    for (const evidence of tactic.evidence) {
      summary += `  - ${evidence}\n`;
    }
    summary += `\n`;
    
    summary += `Counter-Argument:\n`;
    summary += `  ${tactic.counterArgument}\n\n`;
    summary += `${'-'.repeat(60)}\n\n`;
  }
  
  summary += `RECOMMENDATIONS:\n`;
  for (const rec of result.recommendations) {
    summary += `- ${rec}\n`;
  }
  
  return summary;
}
