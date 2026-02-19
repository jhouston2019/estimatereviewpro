/**
 * Comprehensive Report Type Definitions
 * Enterprise-ready type system for estimate analysis reports
 */

export type EstimateClassificationType = 'XACTIMATE' | 'SYMBILITY' | 'MANUAL' | 'UNKNOWN';

export type SeverityLevel = 'error' | 'warning' | 'info';

export type IssueType = 
  | 'zero_quantity' 
  | 'removal_without_replacement' 
  | 'replacement_without_removal' 
  | 'quantity_mismatch';

export type GapType = 
  | 'missing_trade' 
  | 'incomplete_scope' 
  | 'missing_labor' 
  | 'missing_material';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ComplianceStatus = 'not_documented' | 'missing' | 'included' | 'not_specified' | 'not_addressed' | 'not_included' | 'not_verified';

export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'multi-family';

export type DamageType = 
  | 'water_damage' 
  | 'fire_damage' 
  | 'storm_damage' 
  | 'hurricane_damage' 
  | 'hail_wind_damage' 
  | 'mold_damage' 
  | 'flood_damage' 
  | 'smoke_damage';

/**
 * Classification Metadata
 */
export interface ClassificationMetadata {
  detected_format: string;
  line_item_count: number;
  trade_codes_found: string[];
}

/**
 * Estimate Classification
 */
export interface EstimateClassification {
  classification: EstimateClassificationType;
  confidence: number;
  platform?: string;
  metadata?: ClassificationMetadata;
}

/**
 * Property Details
 */
export interface PropertyDetails {
  address: string;
  claim_number: string;
  date_of_loss: string;
  adjuster: string;
  total_estimate_value: number;
  building_type?: string;
  square_footage?: number;
  roof_area?: string;
  storm_name?: string;
  affected_areas: string[];
}

/**
 * Line Item
 */
export interface LineItem {
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total?: number;
}

/**
 * Trade Category
 */
export interface TradeCategory {
  code: string;
  name: string;
  line_items: LineItem[];
  subtotal: number;
}

/**
 * Missing Item
 */
export interface MissingItem {
  category: string;
  description: string;
  severity: SeverityLevel;
  expected_for_damage_type: boolean;
  estimated_cost_impact: string;
  xactimate_codes?: string[];
  justification?: string;
}

/**
 * Quantity Issue
 */
export interface QuantityIssue {
  line_item: string;
  issue_type: IssueType;
  description: string;
  recommended_quantity?: string;
  recommended_addition?: string;
  cost_impact: number | string;
}

/**
 * Structural Gap
 */
export interface StructuralGap {
  category: string;
  gap_type: GapType;
  description: string;
  estimated_cost: string;
  xactimate_codes?: string[];
}

/**
 * Pricing Observation
 */
export interface PricingObservation {
  item: string;
  observed_price: number | string;
  typical_range: string;
  note: string;
}

/**
 * Compliance Note
 */
export interface ComplianceNote {
  standard: string;
  requirement: string;
  status: ComplianceStatus;
  description: string;
}

/**
 * Missing Value Estimate
 */
export interface MissingValueEstimate {
  low: number;
  high: number;
}

/**
 * Report Metadata
 */
export interface ReportMetadata {
  processing_time_ms: number;
  model_version: string;
  timestamp: string;
  analysis_depth: 'basic' | 'standard' | 'comprehensive' | 'detailed';
  confidence_score: number;
}

/**
 * Complete Report Analysis Result
 * This is the structure stored in reports.result_json
 */
export interface ReportAnalysis {
  classification: EstimateClassification;
  property_details: PropertyDetails;
  detected_trades: TradeCategory[];
  missing_items: MissingItem[];
  quantity_issues: QuantityIssue[];
  structural_gaps: StructuralGap[];
  pricing_observations: PricingObservation[];
  compliance_notes: ComplianceNote[];
  summary: string;
  risk_level: RiskLevel;
  total_missing_value_estimate: MissingValueEstimate;
  critical_action_items: string[];
  recommendations_for_adjuster?: string[];
  positive_findings?: string[];
  metadata: ReportMetadata;
}

/**
 * Database Report Record
 */
export interface Report {
  id: string;
  user_id: string;
  team_id: string | null;
  estimate_name: string;
  estimate_type: PropertyType | null;
  damage_type: DamageType | null;
  result_json: ReportAnalysis;
  paid_single_use: boolean;
  created_at: string;
  expires_at: string | null;
}

/**
 * Report Summary View
 */
export interface ReportSummary {
  id: string;
  estimate_name: string;
  estimate_type: PropertyType | null;
  damage_type: DamageType | null;
  created_at: string;
  user_email: string;
  team_name: string | null;
  classification_type: EstimateClassificationType;
  confidence: number;
  estimate_value: number;
  risk_level: RiskLevel;
  missing_value_low: number;
  missing_value_high: number;
  trade_count: number;
  missing_item_count: number;
  quantity_issue_count: number;
}

/**
 * Type Guards
 */
export function isValidReport(data: any): data is Report {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.estimate_name === 'string' &&
    data.result_json &&
    typeof data.result_json === 'object'
  );
}

export function isValidReportAnalysis(data: any): data is ReportAnalysis {
  return (
    data &&
    data.classification &&
    data.property_details &&
    Array.isArray(data.detected_trades) &&
    Array.isArray(data.missing_items) &&
    typeof data.summary === 'string' &&
    typeof data.risk_level === 'string'
  );
}

/**
 * Helper Functions
 */
export function calculateGapPercentage(
  estimateValue: number,
  missingValueLow: number,
  missingValueHigh: number
): { low: number; high: number } {
  return {
    low: Math.round((missingValueLow / estimateValue) * 100),
    high: Math.round((missingValueHigh / estimateValue) * 100),
  };
}

export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'low':
      return '#10b981'; // Green
    case 'medium':
      return '#f59e0b'; // Yellow
    case 'high':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'error':
      return '#ef4444'; // Red
    case 'warning':
      return '#f59e0b'; // Yellow
    case 'info':
      return '#3b82f6'; // Blue
    default:
      return '#6b7280'; // Gray
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyRange(low: number, high: number): string {
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

/**
 * Report Statistics
 */
export interface ReportStatistics {
  totalReports: number;
  totalEstimateValue: number;
  totalMissingValueLow: number;
  totalMissingValueHigh: number;
  averageGapPercentageLow: number;
  averageGapPercentageHigh: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  damageTypeDistribution: Record<string, number>;
  mostCommonMissingItems: Array<{ category: string; count: number }>;
}

export function calculateReportStatistics(reports: Report[]): ReportStatistics {
  const stats: ReportStatistics = {
    totalReports: reports.length,
    totalEstimateValue: 0,
    totalMissingValueLow: 0,
    totalMissingValueHigh: 0,
    averageGapPercentageLow: 0,
    averageGapPercentageHigh: 0,
    riskDistribution: { low: 0, medium: 0, high: 0 },
    damageTypeDistribution: {},
    mostCommonMissingItems: [],
  };

  let totalGapLow = 0;
  let totalGapHigh = 0;

  reports.forEach((report) => {
    const analysis = report.result_json;
    
    stats.totalEstimateValue += analysis.property_details.total_estimate_value;
    stats.totalMissingValueLow += analysis.total_missing_value_estimate.low;
    stats.totalMissingValueHigh += analysis.total_missing_value_estimate.high;

    const gap = calculateGapPercentage(
      analysis.property_details.total_estimate_value,
      analysis.total_missing_value_estimate.low,
      analysis.total_missing_value_estimate.high
    );
    totalGapLow += gap.low;
    totalGapHigh += gap.high;

    stats.riskDistribution[analysis.risk_level]++;

    if (report.damage_type) {
      stats.damageTypeDistribution[report.damage_type] = 
        (stats.damageTypeDistribution[report.damage_type] || 0) + 1;
    }
  });

  stats.averageGapPercentageLow = Math.round(totalGapLow / reports.length);
  stats.averageGapPercentageHigh = Math.round(totalGapHigh / reports.length);

  return stats;
}

/**
 * Export utilities
 */
export const ReportExportFormats = {
  PDF: 'pdf',
  EXCEL: 'xlsx',
  CSV: 'csv',
  JSON: 'json',
} as const;

export type ExportFormat = typeof ReportExportFormats[keyof typeof ReportExportFormats];

/**
 * Filter options for reports
 */
export interface ReportFilters {
  damageType?: DamageType[];
  propertyType?: PropertyType[];
  riskLevel?: RiskLevel[];
  minEstimateValue?: number;
  maxEstimateValue?: number;
  minMissingValue?: number;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

/**
 * Sort options for reports
 */
export type ReportSortField = 
  | 'created_at' 
  | 'estimate_value' 
  | 'missing_value' 
  | 'risk_level' 
  | 'confidence';

export type SortDirection = 'asc' | 'desc';

export interface ReportSortOptions {
  field: ReportSortField;
  direction: SortDirection;
}
