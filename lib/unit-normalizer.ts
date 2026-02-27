/**
 * UNIT NORMALIZATION ENGINE
 * Converts between different units for accurate cross-unit comparisons
 * Supports: SF ↔ SQ, LF ↔ FT, SY ↔ SF, CY ↔ CF, GAL ↔ QT
 */

export type Unit = 'SF' | 'SQ' | 'LF' | 'FT' | 'SY' | 'CY' | 'CF' | 'GAL' | 'QT' | 'EA' | 'PR' | 'HR' | 'LS' | 'TON' | 'MBF' | 'MLF';

export interface NormalizedQuantity {
  originalQuantity: number;
  originalUnit: string;
  normalizedQuantity: number;
  normalizedUnit: string;
  conversionFactor: number;
}

/**
 * Unit conversion factors
 */
const CONVERSION_FACTORS: Record<string, Record<string, number>> = {
  // Area conversions
  'SF': {
    'SF': 1,
    'SQ': 0.01,      // 100 SF = 1 SQ
    'SY': 0.111111,  // 9 SF = 1 SY
  },
  'SQ': {
    'SQ': 1,
    'SF': 100,       // 1 SQ = 100 SF
    'SY': 11.111111, // 1 SQ = 11.11 SY
  },
  'SY': {
    'SY': 1,
    'SF': 9,         // 1 SY = 9 SF
    'SQ': 0.09,      // 1 SY = 0.09 SQ
  },
  
  // Linear conversions
  'LF': {
    'LF': 1,
    'FT': 1,         // 1 LF = 1 FT (same unit)
    'MLF': 0.001,    // 1000 LF = 1 MLF
  },
  'FT': {
    'FT': 1,
    'LF': 1,         // 1 FT = 1 LF (same unit)
    'MLF': 0.001,    // 1000 FT = 1 MLF
  },
  'MLF': {
    'MLF': 1,
    'LF': 1000,      // 1 MLF = 1000 LF
    'FT': 1000,      // 1 MLF = 1000 FT
  },
  
  // Volume conversions
  'CY': {
    'CY': 1,
    'CF': 27,        // 1 CY = 27 CF
  },
  'CF': {
    'CF': 1,
    'CY': 0.037037,  // 27 CF = 1 CY
  },
  
  // Liquid conversions
  'GAL': {
    'GAL': 1,
    'QT': 4,         // 1 GAL = 4 QT
  },
  'QT': {
    'QT': 1,
    'GAL': 0.25,     // 4 QT = 1 GAL
  },
  
  // Board foot conversions
  'MBF': {
    'MBF': 1,
    'BF': 1000,      // 1 MBF = 1000 BF
  },
  'BF': {
    'BF': 1,
    'MBF': 0.001,    // 1000 BF = 1 MBF
  },
  
  // Units that don't convert
  'EA': { 'EA': 1 },
  'PR': { 'PR': 1 },
  'HR': { 'HR': 1 },
  'LS': { 'LS': 1 },
  'TON': { 'TON': 1 },
};

/**
 * Preferred base units for each category
 */
const BASE_UNITS: Record<string, string> = {
  // Area
  'SF': 'SF',
  'SQ': 'SF',
  'SY': 'SF',
  
  // Linear
  'LF': 'LF',
  'FT': 'LF',
  'MLF': 'LF',
  
  // Volume
  'CY': 'CY',
  'CF': 'CY',
  
  // Liquid
  'GAL': 'GAL',
  'QT': 'GAL',
  
  // Board feet
  'MBF': 'MBF',
  'BF': 'MBF',
  
  // No conversion
  'EA': 'EA',
  'PR': 'PR',
  'HR': 'HR',
  'LS': 'LS',
  'TON': 'TON',
};

/**
 * Normalize quantity to base unit
 */
export function normalizeQuantity(quantity: number, unit: string): NormalizedQuantity {
  const unitUpper = unit.toUpperCase();
  const baseUnit = BASE_UNITS[unitUpper] || unitUpper;
  
  // If already in base unit, return as-is
  if (unitUpper === baseUnit) {
    return {
      originalQuantity: quantity,
      originalUnit: unit,
      normalizedQuantity: quantity,
      normalizedUnit: baseUnit,
      conversionFactor: 1,
    };
  }
  
  // Get conversion factor
  const conversionFactor = getConversionFactor(unitUpper, baseUnit);
  const normalizedQuantity = quantity * conversionFactor;
  
  return {
    originalQuantity: quantity,
    originalUnit: unit,
    normalizedQuantity,
    normalizedUnit: baseUnit,
    conversionFactor,
  };
}

/**
 * Convert quantity from one unit to another
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  const fromUpper = fromUnit.toUpperCase();
  const toUpper = toUnit.toUpperCase();
  
  // If same unit, return as-is
  if (fromUpper === toUpper) {
    return quantity;
  }
  
  // Get conversion factor
  const conversionFactor = getConversionFactor(fromUpper, toUpper);
  
  if (conversionFactor === null) {
    console.warn(`[UNIT-NORMALIZER] Cannot convert from ${fromUnit} to ${toUnit}`);
    return quantity;
  }
  
  return quantity * conversionFactor;
}

/**
 * Get conversion factor between two units
 */
export function getConversionFactor(fromUnit: string, toUnit: string): number {
  const fromUpper = fromUnit.toUpperCase();
  const toUpper = toUnit.toUpperCase();
  
  // Check if direct conversion exists
  if (CONVERSION_FACTORS[fromUpper] && CONVERSION_FACTORS[fromUpper][toUpper]) {
    return CONVERSION_FACTORS[fromUpper][toUpper];
  }
  
  // Try indirect conversion through base unit
  const baseUnit = BASE_UNITS[fromUpper];
  if (baseUnit && baseUnit !== fromUpper && baseUnit !== toUpper) {
    const toBase = CONVERSION_FACTORS[fromUpper]?.[baseUnit];
    const fromBase = CONVERSION_FACTORS[baseUnit]?.[toUpper];
    
    if (toBase && fromBase) {
      return toBase * fromBase;
    }
  }
  
  // No conversion available
  return 1;
}

/**
 * Check if two units are compatible (can be converted)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const unit1Upper = unit1.toUpperCase();
  const unit2Upper = unit2.toUpperCase();
  
  // Same unit
  if (unit1Upper === unit2Upper) {
    return true;
  }
  
  // Check if they share the same base unit
  const base1 = BASE_UNITS[unit1Upper];
  const base2 = BASE_UNITS[unit2Upper];
  
  return base1 === base2;
}

/**
 * Get unit category (area, linear, volume, etc.)
 */
export function getUnitCategory(unit: string): string {
  const unitUpper = unit.toUpperCase();
  const baseUnit = BASE_UNITS[unitUpper];
  
  if (['SF', 'SQ', 'SY'].includes(baseUnit)) return 'area';
  if (['LF', 'FT', 'MLF'].includes(baseUnit)) return 'linear';
  if (['CY', 'CF'].includes(baseUnit)) return 'volume';
  if (['GAL', 'QT'].includes(baseUnit)) return 'liquid';
  if (['MBF', 'BF'].includes(baseUnit)) return 'board_feet';
  if (baseUnit === 'EA') return 'each';
  if (baseUnit === 'PR') return 'pair';
  if (baseUnit === 'HR') return 'hour';
  if (baseUnit === 'LS') return 'lump_sum';
  if (baseUnit === 'TON') return 'weight';
  
  return 'unknown';
}

/**
 * Format normalized quantity for display
 */
export function formatNormalizedQuantity(normalized: NormalizedQuantity): string {
  const { originalQuantity, originalUnit, normalizedQuantity, normalizedUnit, conversionFactor } = normalized;
  
  if (conversionFactor === 1) {
    return `${originalQuantity} ${originalUnit}`;
  }
  
  return `${originalQuantity} ${originalUnit} (${normalizedQuantity.toFixed(2)} ${normalizedUnit})`;
}

/**
 * Normalize line item quantities for comparison
 */
export interface LineItemWithNormalizedQuantity {
  lineNumber: number;
  description: string;
  originalQuantity: number;
  originalUnit: string;
  normalizedQuantity: number;
  normalizedUnit: string;
  conversionFactor: number;
}

export function normalizeLineItems(lineItems: Array<{ quantity: number; unit: string; description: string; lineNumber?: number }>): LineItemWithNormalizedQuantity[] {
  return lineItems.map((item, index) => {
    const normalized = normalizeQuantity(item.quantity, item.unit);
    
    return {
      lineNumber: item.lineNumber || index + 1,
      description: item.description,
      originalQuantity: normalized.originalQuantity,
      originalUnit: normalized.originalUnit,
      normalizedQuantity: normalized.normalizedQuantity,
      normalizedUnit: normalized.normalizedUnit,
      conversionFactor: normalized.conversionFactor,
    };
  });
}

/**
 * Compare quantities across different units
 */
export interface QuantityComparison {
  item1: {
    quantity: number;
    unit: string;
    normalized: number;
  };
  item2: {
    quantity: number;
    unit: string;
    normalized: number;
  };
  difference: number;
  differencePercentage: number;
  compatible: boolean;
}

export function compareQuantities(
  quantity1: number,
  unit1: string,
  quantity2: number,
  unit2: string
): QuantityComparison {
  const compatible = areUnitsCompatible(unit1, unit2);
  
  if (!compatible) {
    return {
      item1: { quantity: quantity1, unit: unit1, normalized: quantity1 },
      item2: { quantity: quantity2, unit: unit2, normalized: quantity2 },
      difference: 0,
      differencePercentage: 0,
      compatible: false,
    };
  }
  
  const normalized1 = normalizeQuantity(quantity1, unit1);
  const normalized2 = normalizeQuantity(quantity2, unit2);
  
  const difference = normalized1.normalizedQuantity - normalized2.normalizedQuantity;
  const differencePercentage = (difference / normalized1.normalizedQuantity) * 100;
  
  return {
    item1: {
      quantity: quantity1,
      unit: unit1,
      normalized: normalized1.normalizedQuantity,
    },
    item2: {
      quantity: quantity2,
      unit: unit2,
      normalized: normalized2.normalizedQuantity,
    },
    difference,
    differencePercentage,
    compatible: true,
  };
}

/**
 * Validate unit string
 */
export function isValidUnit(unit: string): boolean {
  const unitUpper = unit.toUpperCase();
  return unitUpper in BASE_UNITS || unitUpper in CONVERSION_FACTORS;
}

/**
 * Get all supported units
 */
export function getSupportedUnits(): string[] {
  return Object.keys(BASE_UNITS);
}

/**
 * Get units in same category
 */
export function getUnitsInCategory(category: string): string[] {
  return Object.entries(BASE_UNITS)
    .filter(([unit, base]) => {
      const cat = getUnitCategory(unit);
      return cat === category;
    })
    .map(([unit]) => unit);
}
