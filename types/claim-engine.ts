/**
 * STANDARDIZED CLAIM ENGINE TYPES
 * All intelligence engines must conform to these interfaces
 */

export interface EngineResult {
  issues: ClaimIssue[];
  audit: AuditEvent[];
  metadata?: Record<string, any>;
}

export interface ClaimIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  financialImpact?: number;
  lineItemsAffected?: number[];
  recommendation?: string;
}

export interface AuditEvent {
  engine: string;
  decision: string;
  confidence: number;
  timestamp: number;
  inputData?: any;
  outputData?: any;
  processingTimeMs?: number;
}

export interface StandardizedEstimate {
  id?: string;
  carrier?: string;
  lineItems: StandardizedLineItem[];
  totals: {
    rcv: number;
    acv: number;
    depreciation: number;
  };
  metadata?: {
    format?: string;
    region?: string;
    lossType?: string;
    [key: string]: any;
  };
}

export interface StandardizedLineItem {
  lineNumber: number;
  tradeCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  rcv: number;
  acv: number;
  depreciation: number;
  actionType?: string;
}
