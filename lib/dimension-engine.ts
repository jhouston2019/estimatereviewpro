/**
 * DIMENSION ENGINE
 * Calculates expected quantities from room dimensions
 * Supports Matterport CSV, sketch exports, and manual entry
 * NO GUESSING - uses actual measurements only
 */

export type CeilingType = 'FLAT' | 'VAULTED' | 'CATHEDRAL' | 'TRAY' | 'COFFERED';
export type ScopeRule = 'FULL_HEIGHT' | '2FT_CUT' | '4FT_CUT' | 'CEILING_ONLY' | 'FLOOR_ONLY';

export interface Room {
  name: string;
  length: number;  // feet
  width: number;   // feet
  height: number;  // feet
  ceilingType?: CeilingType;
  notes?: string;
}

export interface DimensionInput {
  rooms: Room[];
  sourceType: 'MATTERPORT' | 'SKETCH' | 'MANUAL';
  metadata?: {
    projectName?: string;
    dateCreated?: string;
    scanQuality?: string;
  };
}

export interface ExpectedQuantities {
  drywallSF: number;
  paintSF: number;
  flooringSF: number;
  baseboardLF: number;
  ceilingSF: number;
  insulationSF: number;
  breakdown: {
    rooms: RoomQuantities[]; // Primary field
    byRoom: RoomQuantities[]; // Alias for backward compatibility
    totals: {
      totalWallSF: number;
      totalCeilingSF: number;
      totalFloorSF: number;
      totalPerimeterLF: number;
    };
  };
}

export interface RoomQuantities {
  roomName: string;
  wallSF: number;
  ceilingSF: number;
  floorSF: number;
  perimeterLF: number;
  height: number; // Preserve actual room height
  length: number;
  width: number;
}

export interface ScopeAdjustment {
  rule: ScopeRule;
  reason: string;
  multiplier: number;
  affectedTrades: string[];
}

/**
 * Calculate room quantities
 */
function calculateRoomQuantities(room: Room): RoomQuantities {
  const { length, width, height } = room;
  
  // Floor area
  const floorSF = length * width;
  
  // Ceiling area (same as floor for flat ceilings)
  let ceilingSF = floorSF;
  
  // Adjust for ceiling type
  if (room.ceilingType === 'VAULTED' || room.ceilingType === 'CATHEDRAL') {
    ceilingSF = floorSF * 1.3; // 30% increase for slope
  } else if (room.ceilingType === 'TRAY') {
    ceilingSF = floorSF * 1.15; // 15% increase for tray
  } else if (room.ceilingType === 'COFFERED') {
    ceilingSF = floorSF * 1.25; // 25% increase for detail
  }
  
  // Perimeter
  const perimeterLF = (length + width) * 2;
  
  // Wall area (4 walls)
  const wallSF = perimeterLF * height;
  
  return {
    roomName: room.name,
    wallSF: Math.round(wallSF * 100) / 100,
    ceilingSF: Math.round(ceilingSF * 100) / 100,
    floorSF: Math.round(floorSF * 100) / 100,
    perimeterLF: Math.round(perimeterLF * 100) / 100,
    height: room.height,
    length: room.length,
    width: room.width
  };
}

/**
 * Apply scope rule adjustments
 */
function applyScopeRule(
  baseQuantities: RoomQuantities[],
  scopeRule: ScopeRule
): { adjusted: RoomQuantities[]; adjustment: ScopeAdjustment } {
  
  let multiplier = 1.0;
  let reason = '';
  let affectedTrades: string[] = [];
  
  switch (scopeRule) {
    case 'FULL_HEIGHT':
      multiplier = 1.0;
      reason = 'Full height drywall replacement';
      affectedTrades = ['DRY', 'INS', 'PNT'];
      break;
      
    case '2FT_CUT':
      multiplier = 2 / 8; // Assuming 8ft ceilings
      reason = '2 ft flood cut (Water Level 2)';
      affectedTrades = ['DRY', 'INS', 'PNT'];
      break;
      
    case '4FT_CUT':
      multiplier = 4 / 8; // Assuming 8ft ceilings
      reason = '4 ft flood cut (Water Level 3 or expert directive)';
      affectedTrades = ['DRY', 'INS', 'PNT'];
      break;
      
    case 'CEILING_ONLY':
      multiplier = 0; // Zero out walls
      reason = 'Ceiling work only';
      affectedTrades = ['DRY', 'PNT', 'INS'];
      break;
      
    case 'FLOOR_ONLY':
      multiplier = 0; // Zero out walls and ceiling
      reason = 'Flooring work only';
      affectedTrades = ['FLR', 'CRP', 'VCT'];
      break;
  }
  
  const adjusted = baseQuantities.map(room => ({
    ...room,
    wallSF: scopeRule === 'CEILING_ONLY' || scopeRule === 'FLOOR_ONLY' 
      ? 0 
      : Math.round(room.wallSF * multiplier * 100) / 100,
    ceilingSF: scopeRule === 'FLOOR_ONLY' 
      ? 0 
      : room.ceilingSF,
    floorSF: room.floorSF
  }));
  
  return {
    adjusted,
    adjustment: {
      rule: scopeRule,
      reason,
      multiplier,
      affectedTrades
    }
  };
}

/**
 * Calculate expected quantities from dimensions
 */
export function calculateExpectedQuantities(
  input: DimensionInput,
  scopeRule: ScopeRule = 'FULL_HEIGHT'
): ExpectedQuantities {
  
  // Validate input
  if (!input.rooms || input.rooms.length === 0) {
    throw new Error('No rooms provided for dimension calculation');
  }
  
  for (const room of input.rooms) {
    if (!room.length || !room.width || !room.height) {
      throw new Error(`Room "${room.name}" missing required dimensions (length, width, height)`);
    }
    
    if (room.length <= 0 || room.width <= 0 || room.height <= 0) {
      throw new Error(`Room "${room.name}" has invalid dimensions (must be > 0)`);
    }
  }
  
  // Calculate base quantities for each room
  const baseQuantities = input.rooms.map(room => calculateRoomQuantities(room));
  
  // Apply scope rule
  const { adjusted, adjustment } = applyScopeRule(baseQuantities, scopeRule);
  
  // Calculate totals
  const totalWallSF = adjusted.reduce((sum, room) => sum + room.wallSF, 0);
  const totalCeilingSF = adjusted.reduce((sum, room) => sum + room.ceilingSF, 0);
  const totalFloorSF = adjusted.reduce((sum, room) => sum + room.floorSF, 0);
  const totalPerimeterLF = adjusted.reduce((sum, room) => sum + room.perimeterLF, 0);
  
  // Expected quantities by trade
  const drywallSF = totalWallSF + totalCeilingSF;
  const paintSF = totalWallSF + totalCeilingSF;
  const flooringSF = totalFloorSF;
  const baseboardLF = totalPerimeterLF;
  const ceilingSF = totalCeilingSF;
  const insulationSF = totalWallSF; // Exterior walls only (conservative estimate)
  
  return {
    drywallSF: Math.round(drywallSF * 100) / 100,
    paintSF: Math.round(paintSF * 100) / 100,
    flooringSF: Math.round(flooringSF * 100) / 100,
    baseboardLF: Math.round(baseboardLF * 100) / 100,
    ceilingSF: Math.round(ceilingSF * 100) / 100,
    insulationSF: Math.round(insulationSF * 100) / 100,
    breakdown: {
      rooms: adjusted, // Changed from byRoom to rooms for consistency
      byRoom: adjusted, // Keep both for backward compatibility
      totals: {
        totalWallSF: Math.round(totalWallSF * 100) / 100,
        totalCeilingSF: Math.round(totalCeilingSF * 100) / 100,
        totalFloorSF: Math.round(totalFloorSF * 100) / 100,
        totalPerimeterLF: Math.round(totalPerimeterLF * 100) / 100
      }
    }
  };
}

/**
 * Validate dimension input
 */
export function validateDimensionInput(input: DimensionInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input.rooms || input.rooms.length === 0) {
    errors.push('No rooms provided');
  }
  
  if (input.rooms) {
    for (let i = 0; i < input.rooms.length; i++) {
      const room = input.rooms[i];
      
      if (!room.name || room.name.trim().length === 0) {
        errors.push(`Room ${i + 1}: Missing name`);
      }
      
      if (!room.length || room.length <= 0) {
        errors.push(`Room "${room.name}": Invalid length (${room.length})`);
      }
      
      if (!room.width || room.width <= 0) {
        errors.push(`Room "${room.name}": Invalid width (${room.width})`);
      }
      
      if (!room.height || room.height <= 0) {
        errors.push(`Room "${room.name}": Invalid height (${room.height})`);
      }
      
      // Sanity checks
      if (room.length > 100) {
        errors.push(`Room "${room.name}": Length ${room.length} ft seems unusually large`);
      }
      
      if (room.width > 100) {
        errors.push(`Room "${room.name}": Width ${room.width} ft seems unusually large`);
      }
      
      if (room.height > 20) {
        errors.push(`Room "${room.name}": Height ${room.height} ft seems unusually large`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Infer scope rule from loss type and severity
 */
export function inferScopeRule(lossType: string, severityLevel: string): ScopeRule {
  if (lossType === 'WATER') {
    if (severityLevel.includes('LEVEL_1')) {
      return 'FLOOR_ONLY';
    } else if (severityLevel.includes('LEVEL_2')) {
      return '2FT_CUT';
    } else if (severityLevel.includes('LEVEL_3') || severityLevel.includes('CATEGORY_3')) {
      return '4FT_CUT';
    }
  }
  
  if (lossType === 'FIRE') {
    if (severityLevel.includes('MODERATE') || severityLevel.includes('HEAVY')) {
      return 'FULL_HEIGHT';
    }
  }
  
  return 'FULL_HEIGHT';
}
