/**
 * LITIGATION EVIDENCE GENERATOR
 * Generates attorney-ready evidence reports for each detected issue
 */

import { ClaimIssue } from '../../types/claim-engine';
import { ReconstructedEstimate, MissingLineItem } from '../engines/scopeReconstructionEngine';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export interface LitigationEvidence {
  issueId: string;
  issueType: string;
  issueSeverity: string;
  issueTitle: string;
  evidence: string;
  industryStandard: string;
  carrierDeviation: string;
  financialImpact: number;
  supportingDocumentation: string[];
  legalBasis: string;
  recommendation: string;
}

export interface LitigationReport {
  reportId: string;
  carrier: string;
  claimType: string;
  evidenceItems: LitigationEvidence[];
  totalFinancialImpact: number;
  executiveSummary: string;
  generatedAt: string;
}

/**
 * Get industry standard reference for issue type
 */
function getIndustryStandard(issueType: string, description: string): string {
  const desc = description.toLowerCase();
  
  // Roofing standards
  if (desc.includes('drip edge')) {
    return 'IRC R903.2 requires drip edge installation at all roof edges';
  }
  if (desc.includes('ice') && desc.includes('water')) {
    return 'IRC R905.2.7 requires ice and water shield in valleys and eaves';
  }
  if (desc.includes('starter')) {
    return 'Manufacturer specifications require starter strip for warranty compliance';
  }
  if (desc.includes('ridge vent')) {
    return 'IRC R806 requires proper attic ventilation (1:150 ratio minimum)';
  }
  
  // Depreciation standards
  if (issueType.includes('depreciation')) {
    if (desc.includes('labor')) {
      return 'Labor is not depreciable per insurance industry standards and case law';
    }
    if (desc.includes('permit')) {
      return 'Permits and fees are not depreciable items';
    }
    if (desc.includes('o&p') || desc.includes('overhead')) {
      return 'Overhead & Profit are not depreciable per industry standards';
    }
    return 'Depreciation must follow industry-standard useful life tables';
  }
  
  // Labor standards
  if (issueType.includes('labor')) {
    return 'Labor rates must reflect current regional market standards per Davis-Bacon Act and local prevailing wage data';
  }
  
  // O&P standards
  if (issueType.includes('op_gap')) {
    return 'Industry standard O&P is 10% overhead + 10% profit when multiple trades are involved';
  }
  
  // Pricing standards
  if (issueType.includes('pricing')) {
    return 'Pricing must reflect current market rates per Xactimate, RSMeans, or equivalent pricing databases';
  }
  
  return 'Industry standard practices and building codes';
}

/**
 * Get legal basis for issue
 */
function getLegalBasis(issueType: string): string {
  if (issueType.includes('depreciation')) {
    return 'Insurance policy contract requires actual cash value (ACV) to be calculated using reasonable depreciation. Excessive or improper depreciation violates the policy terms.';
  }
  
  if (issueType.includes('labor')) {
    return 'Labor costs are not depreciable and must reflect current market rates. Suppression of labor rates constitutes underpayment.';
  }
  
  if (issueType.includes('op_gap')) {
    return 'When multiple trades are involved, overhead and profit must be included per industry standards and policy requirements.';
  }
  
  if (issueType.includes('pricing')) {
    return 'Insurance policies require payment of reasonable and necessary costs. Suppressed pricing below market rates constitutes underpayment.';
  }
  
  if (issueType.includes('scope')) {
    return 'Insurance policies require repair to pre-loss condition. Missing scope items necessary for proper repair constitute breach of contract.';
  }
  
  return 'Insurance policy requires full and fair payment for covered damages.';
}

/**
 * Get supporting documentation references
 */
function getSupportingDocumentation(issueType: string, description: string): string[] {
  const docs: string[] = [];
  
  // Building codes
  if (description.toLowerCase().includes('code') || issueType.includes('scope')) {
    docs.push('International Residential Code (IRC)');
    docs.push('Local building code requirements');
  }
  
  // Pricing references
  if (issueType.includes('pricing') || issueType.includes('labor')) {
    docs.push('Xactimate pricing database');
    docs.push('RSMeans cost data');
    docs.push('Regional labor rate surveys');
  }
  
  // Depreciation references
  if (issueType.includes('depreciation')) {
    docs.push('Insurance industry depreciation schedules');
    docs.push('Marshall & Swift depreciation tables');
    docs.push('Case law on labor depreciation');
  }
  
  // O&P references
  if (issueType.includes('op')) {
    docs.push('Industry standard O&P rates (10% + 10%)');
    docs.push('Xactimate O&P guidelines');
  }
  
  // Manufacturer specs
  if (description.toLowerCase().includes('manufacturer') || description.toLowerCase().includes('warranty')) {
    docs.push('Manufacturer installation specifications');
    docs.push('Warranty requirements');
  }
  
  return docs;
}

/**
 * Generate litigation evidence for an issue
 */
function generateEvidenceForIssue(issue: ClaimIssue): LitigationEvidence {
  const industryStandard = getIndustryStandard(issue.type, issue.description);
  const legalBasis = getLegalBasis(issue.type);
  const supportingDocs = getSupportingDocumentation(issue.type, issue.description);
  
  return {
    issueId: issue.id,
    issueType: issue.type,
    issueSeverity: issue.severity,
    issueTitle: issue.title,
    evidence: issue.description,
    industryStandard,
    carrierDeviation: `Carrier estimate deviates from industry standard, resulting in ${issue.financialImpact ? `$${issue.financialImpact.toFixed(2)}` : 'measurable'} underpayment.`,
    financialImpact: issue.financialImpact || 0,
    supportingDocumentation: supportingDocs,
    legalBasis,
    recommendation: issue.recommendation || 'Estimate should be revised to comply with industry standards.',
  };
}

/**
 * Generate litigation evidence for missing scope items
 */
function generateEvidenceForMissingScope(
  missingItems: MissingLineItem[]
): LitigationEvidence[] {
  return missingItems.map((item, index) => ({
    issueId: `missing-scope-${index + 1}`,
    issueType: 'missing_scope',
    issueSeverity: item.estimatedTotal > 2000 ? 'high' : 'medium',
    issueTitle: `Missing: ${item.description}`,
    evidence: `Estimate does not include ${item.description}, which is required for ${item.tradeType} work.`,
    industryStandard: item.industryStandard,
    carrierDeviation: `Carrier omitted required scope item. ${item.reason}`,
    financialImpact: item.estimatedTotal,
    supportingDocumentation: [
      item.industryStandard,
      'Building code requirements',
      'Manufacturer specifications',
    ],
    legalBasis: 'Insurance policy requires repair to pre-loss condition. Missing required scope items constitute incomplete repair and breach of contract.',
    recommendation: `Add ${item.description}: ${item.estimatedQuantity} ${item.unit} @ $${item.estimatedUnitPrice.toFixed(2)} = $${item.estimatedTotal.toFixed(2)}`,
  }));
}

/**
 * Generate complete litigation report
 */
export async function generateLitigationEvidence(
  reportId: string,
  carrier: string,
  claimType: string,
  issues: ClaimIssue[],
  reconstruction: ReconstructedEstimate | null
): Promise<LitigationReport> {
  
  console.log('[LITIGATION-EVIDENCE] Generating evidence report...');
  
  const evidenceItems: LitigationEvidence[] = [];
  
  // Generate evidence for each issue
  for (const issue of issues) {
    if (issue.financialImpact && issue.financialImpact > 0) {
      evidenceItems.push(generateEvidenceForIssue(issue));
    }
  }
  
  // Generate evidence for missing scope
  if (reconstruction && reconstruction.missingLineItems.length > 0) {
    const scopeEvidence = generateEvidenceForMissingScope(reconstruction.missingLineItems);
    evidenceItems.push(...scopeEvidence);
  }
  
  const totalFinancialImpact = evidenceItems.reduce((sum, e) => sum + e.financialImpact, 0);
  
  const executiveSummary = generateExecutiveSummary(
    carrier,
    evidenceItems.length,
    totalFinancialImpact
  );
  
  console.log(`[LITIGATION-EVIDENCE] Generated ${evidenceItems.length} evidence items`);
  console.log(`[LITIGATION-EVIDENCE] Total impact: $${totalFinancialImpact.toFixed(2)}`);
  
  const report: LitigationReport = {
    reportId,
    carrier,
    claimType,
    evidenceItems,
    totalFinancialImpact,
    executiveSummary,
    generatedAt: new Date().toISOString(),
  };
  
  // Store in database
  await storeLitigationEvidence(reportId, evidenceItems);
  
  return report;
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  carrier: string,
  evidenceCount: number,
  totalImpact: number
): string {
  let summary = `EXECUTIVE SUMMARY\n\n`;
  summary += `This analysis identified ${evidenceCount} documented deficiencies in the ${carrier} estimate, `;
  summary += `resulting in a total underpayment of $${totalImpact.toFixed(2)}.\n\n`;
  
  summary += `Each deficiency is supported by:\n`;
  summary += `- Specific evidence from the estimate\n`;
  summary += `- Applicable industry standards and building codes\n`;
  summary += `- Documentation of carrier deviation\n`;
  summary += `- Calculated financial impact\n`;
  summary += `- Legal basis for recovery\n\n`;
  
  if (totalImpact > 20000) {
    summary += `The magnitude of underpayment ($${totalImpact.toFixed(2)}) suggests systematic undervaluation `;
    summary += `rather than isolated errors. This evidence supports a claim of bad faith.\n`;
  } else if (totalImpact > 10000) {
    summary += `The underpayment of $${totalImpact.toFixed(2)} represents material breach of the insurance contract `;
    summary += `and warrants immediate correction.\n`;
  } else {
    summary += `The identified deficiencies total $${totalImpact.toFixed(2)} and should be corrected `;
    summary += `to comply with policy terms.\n`;
  }
  
  return summary;
}

/**
 * Store litigation evidence in database
 */
async function storeLitigationEvidence(
  reportId: string,
  evidenceItems: LitigationEvidence[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[LITIGATION-EVIDENCE] Supabase not configured, skipping storage');
    return;
  }
  
  try {
    const records = evidenceItems.map(evidence => ({
      report_id: reportId,
      issue_type: evidence.issueType,
      evidence_data: {
        title: evidence.issueTitle,
        evidence: evidence.evidence,
        industryStandard: evidence.industryStandard,
        carrierDeviation: evidence.carrierDeviation,
        legalBasis: evidence.legalBasis,
        recommendation: evidence.recommendation,
      },
      industry_standard: evidence.industryStandard,
      carrier_deviation: evidence.carrierDeviation,
      financial_impact: evidence.financialImpact,
      supporting_documentation: evidence.supportingDocumentation,
    }));
    
    const { error } = await (client as any)
      .from('litigation_evidence')
      .insert(records);
    
    if (error) {
      console.error('[LITIGATION-EVIDENCE] Failed to store evidence:', error);
    } else {
      console.log(`[LITIGATION-EVIDENCE] Stored ${records.length} evidence items`);
    }
  } catch (error) {
    console.error('[LITIGATION-EVIDENCE] Storage error:', error);
  }
}

/**
 * Format litigation report as structured text
 */
export function formatLitigationReport(report: LitigationReport): string {
  let output = `LITIGATION EVIDENCE REPORT\n`;
  output += `${'='.repeat(80)}\n\n`;
  
  output += `CASE INFORMATION:\n`;
  output += `- Report ID: ${report.reportId}\n`;
  output += `- Carrier: ${report.carrier}\n`;
  output += `- Claim Type: ${report.claimType}\n`;
  output += `- Evidence Items: ${report.evidenceItems.length}\n`;
  output += `- Total Financial Impact: $${report.totalFinancialImpact.toFixed(2)}\n`;
  output += `- Generated: ${report.generatedAt}\n\n`;
  
  output += `${report.executiveSummary}\n`;
  output += `${'='.repeat(80)}\n\n`;
  
  // Group by severity
  const critical = report.evidenceItems.filter(e => e.issueSeverity === 'critical');
  const high = report.evidenceItems.filter(e => e.issueSeverity === 'high');
  const medium = report.evidenceItems.filter(e => e.issueSeverity === 'medium');
  
  if (critical.length > 0) {
    output += `CRITICAL ISSUES (${critical.length})\n`;
    output += `${'='.repeat(80)}\n\n`;
    for (const evidence of critical) {
      output += formatEvidenceItem(evidence);
    }
  }
  
  if (high.length > 0) {
    output += `HIGH SEVERITY ISSUES (${high.length})\n`;
    output += `${'='.repeat(80)}\n\n`;
    for (const evidence of high) {
      output += formatEvidenceItem(evidence);
    }
  }
  
  if (medium.length > 0) {
    output += `MEDIUM SEVERITY ISSUES (${medium.length})\n`;
    output += `${'='.repeat(80)}\n\n`;
    for (const evidence of medium) {
      output += formatEvidenceItem(evidence);
    }
  }
  
  return output;
}

/**
 * Format individual evidence item
 */
function formatEvidenceItem(evidence: LitigationEvidence): string {
  let output = `ISSUE: ${evidence.issueTitle}\n`;
  output += `Type: ${evidence.issueType}\n`;
  output += `Severity: ${evidence.issueSeverity.toUpperCase()}\n`;
  output += `Financial Impact: $${evidence.financialImpact.toFixed(2)}\n\n`;
  
  output += `EVIDENCE:\n`;
  output += `${evidence.evidence}\n\n`;
  
  output += `INDUSTRY STANDARD:\n`;
  output += `${evidence.industryStandard}\n\n`;
  
  output += `CARRIER DEVIATION:\n`;
  output += `${evidence.carrierDeviation}\n\n`;
  
  output += `LEGAL BASIS:\n`;
  output += `${evidence.legalBasis}\n\n`;
  
  output += `SUPPORTING DOCUMENTATION:\n`;
  for (const doc of evidence.supportingDocumentation) {
    output += `- ${doc}\n`;
  }
  output += `\n`;
  
  output += `RECOMMENDATION:\n`;
  output += `${evidence.recommendation}\n\n`;
  
  output += `${'-'.repeat(80)}\n\n`;
  
  return output;
}

/**
 * Export litigation report as JSON
 */
export function exportLitigationReportJSON(report: LitigationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Generate demand letter summary
 */
export function generateDemandLetterSummary(report: LitigationReport): string {
  let letter = `INSURANCE CLAIM DEFICIENCY NOTICE\n\n`;
  
  letter += `TO: ${report.carrier}\n`;
  letter += `RE: Claim Estimate Deficiencies\n`;
  letter += `DATE: ${new Date().toLocaleDateString()}\n\n`;
  
  letter += `This notice documents ${report.evidenceItems.length} material deficiencies `;
  letter += `in the estimate provided by ${report.carrier}, resulting in underpayment `;
  letter += `totaling $${report.totalFinancialImpact.toFixed(2)}.\n\n`;
  
  letter += `DEFICIENCIES IDENTIFIED:\n\n`;
  
  let itemNum = 1;
  for (const evidence of report.evidenceItems) {
    if (evidence.financialImpact > 500) { // Only include significant items
      letter += `${itemNum}. ${evidence.issueTitle}\n`;
      letter += `   Impact: $${evidence.financialImpact.toFixed(2)}\n`;
      letter += `   Basis: ${evidence.industryStandard}\n\n`;
      itemNum++;
    }
  }
  
  letter += `TOTAL UNDERPAYMENT: $${report.totalFinancialImpact.toFixed(2)}\n\n`;
  
  letter += `We request immediate revision of the estimate to include all required scope items `;
  letter += `and corrections to pricing, depreciation, and labor rates as documented above.\n\n`;
  
  letter += `Please respond within 15 business days with a revised estimate.\n`;
  
  return letter;
}

/**
 * Update report with litigation evidence flag
 */
export async function markLitigationEvidenceGenerated(reportId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  try {
    const { error } = await (client as any)
      .from('reports')
      .update({ litigation_evidence_generated: true })
      .eq('id', reportId);
    
    if (error) {
      console.error('[LITIGATION-EVIDENCE] Failed to update report:', error);
    }
  } catch (error) {
    console.error('[LITIGATION-EVIDENCE] Update error:', error);
  }
}
