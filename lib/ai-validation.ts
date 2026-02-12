import { z } from 'zod';

/**
 * AI Output Schema Validation
 * Ensures all AI responses conform to expected structure
 */

// Estimate Classification Schema
export const EstimateClassificationSchema = z.object({
  classification: z.enum(['XACTIMATE', 'SYMBILITY', 'MANUAL', 'UNKNOWN']),
  confidence: z.number().min(0).max(100),
  platform: z.string().optional(),
  metadata: z.object({
    detected_format: z.string(),
    line_item_count: z.number().int().min(0),
    trade_codes_found: z.array(z.string()),
  }).optional(),
});

// Trade Category Schema
export const TradeCategorySchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })),
});

// Missing Items Schema
export const MissingItemsSchema = z.object({
  category: z.string(),
  description: z.string(),
  severity: z.enum(['warning', 'error', 'info']),
  expected_for_damage_type: z.boolean(),
});

// Quantity Issue Schema
export const QuantityIssueSchema = z.object({
  line_item: z.string(),
  issue_type: z.enum([
    'zero_quantity',
    'removal_without_replacement',
    'replacement_without_removal',
    'quantity_mismatch',
  ]),
  description: z.string(),
});

// Structural Gap Schema
export const StructuralGapSchema = z.object({
  category: z.string(),
  gap_type: z.enum([
    'missing_trade',
    'incomplete_scope',
    'missing_labor',
    'missing_material',
  ]),
  description: z.string(),
});

// Complete AI Analysis Response Schema
export const AIAnalysisResponseSchema = z.object({
  classification: EstimateClassificationSchema,
  detected_trades: z.array(TradeCategorySchema),
  missing_items: z.array(MissingItemsSchema),
  quantity_issues: z.array(QuantityIssueSchema),
  structural_gaps: z.array(StructuralGapSchema),
  summary: z.string().min(10).max(5000),
  metadata: z.object({
    processing_time_ms: z.number().int().min(0),
    model_version: z.string(),
    timestamp: z.string(),
  }),
});

// Type exports
export type EstimateClassification = z.infer<typeof EstimateClassificationSchema>;
export type TradeCategory = z.infer<typeof TradeCategorySchema>;
export type MissingItem = z.infer<typeof MissingItemsSchema>;
export type QuantityIssue = z.infer<typeof QuantityIssueSchema>;
export type StructuralGap = z.infer<typeof StructuralGapSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;

/**
 * Validation Error Types
 */
export class AIValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError | null = null,
    public readonly rawResponse: any = null
  ) {
    super(message);
    this.name = 'AIValidationError';
  }
}

/**
 * Validate AI Response
 * Throws AIValidationError if validation fails
 */
export function validateAIResponse(data: unknown): AIAnalysisResponse {
  try {
    return AIAnalysisResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIValidationError(
        'AI response failed schema validation',
        error,
        data
      );
    }
    throw error;
  }
}

/**
 * Safe Validation (returns result object instead of throwing)
 */
export function safeValidateAIResponse(data: unknown): {
  success: boolean;
  data?: AIAnalysisResponse;
  error?: AIValidationError;
} {
  try {
    const validated = validateAIResponse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof AIValidationError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new AIValidationError('Unknown validation error', null, data),
    };
  }
}

/**
 * Partial Validation (for streaming responses)
 */
export function validatePartialResponse(data: unknown): Partial<AIAnalysisResponse> {
  const PartialSchema = AIAnalysisResponseSchema.partial();
  return PartialSchema.parse(data);
}
