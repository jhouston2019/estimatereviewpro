/**
 * HEIGHT EXTRACTION ENGINE
 * ENTERPRISE-GRADE: Validates extracted heights against room dimensions
 * NO GUESSING - Strict validation with structured errors
 */

import { StructuredLineItem } from './xactimate-structural-parser';
import { RoomQuantities } from './dimension-engine';

export interface HeightExtractionResult {
  extractedHeight: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  method: 'QUANTITY_DIVISION' | 'DESCRIPTION_PARSE' | 'FALLBACK';
  validation: {
    valid: boolean;
    maxAllowedHeight: number;
    exceedsMax: boolean;
    warnings: string[];
  };
  calculation: string;
}

export interface HeightExtractionError {
  code: 'HEIGHT_EXCEEDS_CEILING' | 'INVALID_PERIMETER' | 'INSUFFICIENT_DATA' | 'VALIDATION_FAILED';
  message: string;
  details: {
    extractedHeight?: number;
    maxHeight?: number;
    perimeter?: number;
    quantity?: number;
  };
}

/**
 * Extract height from description (e.g., "Remove drywall 4 ft")
 */
function extractHeightFromDescription(description: string): number | null {
  const patterns = [
    /(\d+)\s*(?:ft|feet|foot|')/i,
    /(\d+)\s*(?:inch|inches|")/i // Convert inches to feet
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      
      // Convert inches to feet
      if (description.toLowerCase().includes('inch') || description.includes('"')) {
        return value / 12;
      }
      
      return value;
    }
  }
  
  return null;
}

/**
 * Extract height from quantity and perimeter with validation
 */
export function extractHeightFromQuantity(
  quantity: number,
  perimeter: number,
  maxHeight: number,
  roomName?: string
): HeightExtractionResult | HeightExtractionError {
  
  // Validate inputs
  if (perimeter <= 0) {
    return {
      code: 'INVALID_PERIMETER',
      message: `Perimeter must be > 0 (got ${perimeter})`,
      details: { perimeter, quantity }
    };
  }
  
  if (quantity <= 0) {
    return {
      code: 'INSUFFICIENT_DATA',
      message: `Quantity must be > 0 (got ${quantity})`,
      details: { quantity, perimeter }
    };
  }
  
  if (maxHeight <= 0) {
    return {
      code: 'INVALID_PERIMETER',
      message: `Max height must be > 0 (got ${maxHeight})`,
      details: { maxHeight }
    };
  }
  
  // Calculate height
  const extractedHeight = quantity / perimeter;
  
  // Validate against max height
  const exceedsMax = extractedHeight > maxHeight;
  const warnings: string[] = [];
  
  if (exceedsMax) {
    return {
      code: 'HEIGHT_EXCEEDS_CEILING',
      message: roomName
        ? `Extracted height ${extractedHeight.toFixed(1)} ft exceeds ceiling height ${maxHeight} ft in room "${roomName}". Ceiling may be included in wall removal quantity.`
        : `Extracted height ${extractedHeight.toFixed(1)} ft exceeds max ceiling height ${maxHeight} ft. Ceiling may be included in wall removal quantity.`,
      details: {
        extractedHeight: Math.round(extractedHeight * 100) / 100,
        maxHeight,
        perimeter,
        quantity
      }
    };
  }
  
  // Confidence scoring
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  
  if (extractedHeight < 1) {
    confidence = 'LOW';
    warnings.push('Extracted height < 1 ft (unusually low)');
  } else if (extractedHeight > maxHeight * 0.95) {
    confidence = 'MEDIUM';
    warnings.push('Extracted height close to ceiling height');
  }
  
  return {
    extractedHeight: Math.round(extractedHeight * 100) / 100,
    confidence,
    method: 'QUANTITY_DIVISION',
    validation: {
      valid: true,
      maxAllowedHeight: maxHeight,
      exceedsMax: false,
      warnings
    },
    calculation: `${quantity} SF ÷ ${perimeter.toFixed(0)} LF = ${extractedHeight.toFixed(1)} ft (max ${maxHeight} ft)`
  };
}

/**
 * Extract and validate height from estimate item
 */
export function extractAndValidateHeight(
  item: StructuredLineItem,
  room: RoomQuantities
): HeightExtractionResult | HeightExtractionError {
  
  const perimeter = 2 * (room.length + room.width);
  
  // Method 1: Try description first
  const descHeight = extractHeightFromDescription(item.description);
  
  if (descHeight !== null) {
    // Validate against room height
    if (descHeight > room.height) {
      return {
        code: 'HEIGHT_EXCEEDS_CEILING',
        message: `Description specifies ${descHeight} ft but room "${room.roomName}" ceiling is ${room.height} ft`,
        details: {
          extractedHeight: descHeight,
          maxHeight: room.height
        }
      };
    }
    
    return {
      extractedHeight: descHeight,
      confidence: 'HIGH',
      method: 'DESCRIPTION_PARSE',
      validation: {
        valid: true,
        maxAllowedHeight: room.height,
        exceedsMax: false,
        warnings: []
      },
      calculation: `Parsed from description: "${item.description}"`
    };
  }
  
  // Method 2: Calculate from quantity
  return extractHeightFromQuantity(item.quantity, perimeter, room.height, room.roomName);
}

/**
 * Validate all height extractions for estimate
 */
export function validateAllHeights(
  items: StructuredLineItem[],
  rooms: RoomQuantities[]
): {
  valid: boolean;
  results: Array<{
    item: StructuredLineItem;
    room: RoomQuantities;
    result: HeightExtractionResult | HeightExtractionError;
  }>;
  errors: HeightExtractionError[];
  warnings: string[];
} {
  
  const results: Array<{
    item: StructuredLineItem;
    room: RoomQuantities;
    result: HeightExtractionResult | HeightExtractionError;
  }> = [];
  
  const errors: HeightExtractionError[] = [];
  const warnings: string[] = [];
  
  // Try to validate each item against each room
  for (const item of items) {
    let validated = false;
    
    for (const room of rooms) {
      const result = extractAndValidateHeight(item, room);
      
      results.push({ item, room, result });
      
      if ('code' in result) {
        errors.push(result);
      } else {
        validated = true;
        warnings.push(...result.validation.warnings);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    results,
    errors,
    warnings
  };
}
