/**
 * REPORT RENDERER - PRESENTATION LAYER ABSTRACTION
 * 
 * This is the central routing layer for all report formats.
 * It accepts structured analysis JSON and routes to specific template builders.
 * 
 * CRITICAL: This layer NEVER recomputes math, NEVER alters calculations,
 * NEVER modifies cost baseline logic. It only maps structured data to formatted sections.
 */

import { Report, ReportAnalysis } from './report-types';
import { Deviation as BaseDeviation } from './deviation-engine';
import { ExpertDirective } from './expert-intelligence-engine';
import { ExpectedQuantities } from './dimension-engine';
import { PhotoAnalysisResult } from './photo-analysis-engine';

// Extended deviation type for template rendering (adds optional display fields)
export interface Deviation extends BaseDeviation {
  unit?: string;
  complianceReference?: string;
}

export type ReportType = 
  | 'NEGOTIATION'
  | 'PUSHBACK'
  | 'APPRAISAL'
  | 'FULL';

export interface ReportMetadata {
  reportId: string;
  claimNumber: string;
  propertyAddress: string;
  dateOfLoss: string;
  estimateName: string;
  expertReportReviewed?: string;
  reportVersion: string;
  costBaselineVersion: string;
  costBaselineDate: string;
  region: string;
  exportTimestamp: string;
  sha256Hash: string;
}

export interface StructuredAnalysisInput {
  report: Report;
  analysis: ReportAnalysis;
  deviations: Deviation[];
  expertDirectives?: ExpertDirective[];
  dimensions?: ExpectedQuantities;
  photoAnalysis?: PhotoAnalysisResult;
}

export interface FormattedReport {
  type: ReportType;
  metadata: ReportMetadata;
  sections: FormattedSection[];
  rawData: StructuredAnalysisInput; // Preserve for consistency validation
}

export interface FormattedSection {
  id: string;
  title: string;
  content: string | object;
  format: 'text' | 'table' | 'list' | 'json';
}

/**
 * Main renderer function - routes to appropriate template
 */
export async function renderReport(
  input: StructuredAnalysisInput,
  reportType: ReportType
): Promise<FormattedReport> {
  
  // Extract metadata (no calculation, just extraction)
  const metadata = extractMetadata(input);
  
  // Route to appropriate template builder
  let sections: FormattedSection[];
  
  switch (reportType) {
    case 'NEGOTIATION':
      const { buildNegotiationTemplate } = await import('./templates/negotiation-template');
      sections = buildNegotiationTemplate(input, metadata);
      break;
      
    case 'PUSHBACK':
      const { buildPushbackTemplate } = await import('./templates/pushback-template');
      sections = buildPushbackTemplate(input, metadata);
      break;
      
    case 'APPRAISAL':
      const { buildAppraisalTemplate } = await import('./templates/appraisal-template');
      sections = buildAppraisalTemplate(input, metadata);
      break;
      
    case 'FULL':
      const { buildFullTemplate } = await import('./templates/full-template');
      sections = buildFullTemplate(input, metadata);
      break;
      
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
  
  return {
    type: reportType,
    metadata,
    sections,
    rawData: input
  };
}

/**
 * Extract metadata from structured input
 * NO CALCULATION - just extraction
 */
function extractMetadata(input: StructuredAnalysisInput): ReportMetadata {
  const { report, analysis } = input;
  const propertyDetails = analysis.property_details;
  const expertIntelligence = (analysis as any).expertIntelligence;
  
  // Generate hash (for verification, not calculation)
  const crypto = require('crypto');
  const hashData = {
    reportId: report.id,
    timestamp: new Date().toISOString()
  };
  const sha256Hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex')
    .substring(0, 16);
  
  return {
    reportId: report.id,
    claimNumber: propertyDetails.claim_number || 'Not specified',
    propertyAddress: propertyDetails.address || 'Not specified',
    dateOfLoss: propertyDetails.date_of_loss || 'Not specified',
    estimateName: report.estimate_name || 'Carrier Estimate',
    expertReportReviewed: expertIntelligence?.present 
      ? `Licensed ${expertIntelligence.authorityType.replace(/_/g, ' ')}`
      : undefined,
    reportVersion: analysis.metadata.model_version,
    costBaselineVersion: '1.0.0', // From cost-baseline.ts
    costBaselineDate: '2026-02-10',
    region: 'US_NATIONAL_AVERAGE',
    exportTimestamp: new Date().toISOString(),
    sha256Hash
  };
}

/**
 * Render multiple report types (for Export All)
 */
export async function renderAllReports(
  input: StructuredAnalysisInput
): Promise<FormattedReport[]> {
  
  const types: ReportType[] = ['NEGOTIATION', 'PUSHBACK', 'APPRAISAL', 'FULL'];
  
  const reports = await Promise.all(
    types.map(type => renderReport(input, type))
  );
  
  return reports;
}

/**
 * Validate consistency across multiple reports
 * Ensures all reports use identical numerical data
 */
export function validateReportConsistency(reports: FormattedReport[]): {
  consistent: boolean;
  errors: string[];
} {
  
  if (reports.length < 2) {
    return { consistent: true, errors: [] };
  }
  
  const errors: string[] = [];
  const baseline = reports[0];
  
  for (let i = 1; i < reports.length; i++) {
    const current = reports[i];
    
    // Check metadata consistency
    if (current.metadata.reportId !== baseline.metadata.reportId) {
      errors.push(`Report ID mismatch: ${baseline.type} vs ${current.type}`);
    }
    
    if (current.metadata.costBaselineVersion !== baseline.metadata.costBaselineVersion) {
      errors.push(`Cost baseline version mismatch: ${baseline.type} vs ${current.type}`);
    }
    
    if (current.metadata.sha256Hash !== baseline.metadata.sha256Hash) {
      errors.push(`Hash mismatch: ${baseline.type} vs ${current.type}`);
    }
    
    // Check raw data consistency (deviations should be identical)
    const baselineDeviations = baseline.rawData.deviations;
    const currentDeviations = current.rawData.deviations;
    
    if (baselineDeviations.length !== currentDeviations.length) {
      errors.push(`Deviation count mismatch: ${baseline.type} (${baselineDeviations.length}) vs ${current.type} (${currentDeviations.length})`);
    }
    
    // Check total exposure consistency
    const baselineTotalMin = baselineDeviations.reduce((sum, d) => sum + d.impactMin, 0);
    const baselineTotalMax = baselineDeviations.reduce((sum, d) => sum + d.impactMax, 0);
    const currentTotalMin = currentDeviations.reduce((sum, d) => sum + d.impactMin, 0);
    const currentTotalMax = currentDeviations.reduce((sum, d) => sum + d.impactMax, 0);
    
    if (baselineTotalMin !== currentTotalMin || baselineTotalMax !== currentTotalMax) {
      errors.push(`Total exposure mismatch: ${baseline.type} ($${baselineTotalMin}-$${baselineTotalMax}) vs ${current.type} ($${currentTotalMin}-$${currentTotalMax})`);
    }
  }
  
  return {
    consistent: errors.length === 0,
    errors
  };
}
