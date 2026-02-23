/**
 * MATTERPORT ADAPTER
 * Ingests Matterport CSV exports and maps to dimension engine
 * Rejects if missing required fields
 */

import { DimensionInput, Room } from './dimension-engine';

export interface MatterportCSVRow {
  roomName?: string;
  name?: string;
  length?: string | number;
  width?: string | number;
  height?: string | number;
  ceilingHeight?: string | number;
  area?: string | number;
  [key: string]: any;
}

export interface MatterportImportResult {
  success: boolean;
  dimensionInput?: DimensionInput;
  errors: string[];
  warnings: string[];
  metadata: {
    rowsProcessed: number;
    roomsImported: number;
    rejectedRows: number;
  };
}

/**
 * Parse CSV text
 */
function parseCSV(csvText: string): MatterportCSVRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one data row');
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Parse rows
  const rows: MatterportCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: MatterportCSVRow = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Extract number from string
 */
function extractNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'number') return value;
  
  // Remove non-numeric characters except decimal point
  const cleaned = value.toString().replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

/**
 * Map Matterport row to Room
 */
function mapRowToRoom(row: MatterportCSVRow, rowIndex: number): { room: Room | null; error?: string } {
  // Try to extract room name
  const roomName = row.roomName || row.name || row.room || row.label || `Room ${rowIndex + 1}`;
  
  if (!roomName || roomName.trim().length === 0) {
    return { room: null, error: `Row ${rowIndex + 1}: Missing room name` };
  }
  
  // Try to extract dimensions
  const length = extractNumber(row.length || row.l || row.lengthft);
  const width = extractNumber(row.width || row.w || row.widthft);
  const height = extractNumber(row.height || row.h || row.ceilingHeight || row.ceilingheight);
  
  // If area is provided but not length/width, try to infer square room
  if (!length || !width) {
    const area = extractNumber(row.area || row.areasf || row.sqft);
    if (area && area > 0) {
      const side = Math.sqrt(area);
      return {
        room: {
          name: roomName.toString(),
          length: Math.round(side * 100) / 100,
          width: Math.round(side * 100) / 100,
          height: height || 8, // Default 8ft ceiling
          notes: `Inferred from area: ${area} SF (assumed square room)`
        }
      };
    }
  }
  
  // Validate required fields
  if (!length || length <= 0) {
    return { room: null, error: `Row ${rowIndex + 1} (${roomName}): Missing or invalid length` };
  }
  
  if (!width || width <= 0) {
    return { room: null, error: `Row ${rowIndex + 1} (${roomName}): Missing or invalid width` };
  }
  
  if (!height || height <= 0) {
    return { room: null, error: `Row ${rowIndex + 1} (${roomName}): Missing or invalid height, using default 8ft` };
  }
  
  return {
    room: {
      name: roomName.toString(),
      length,
      width,
      height: height || 8
    }
  };
}

/**
 * Import Matterport CSV
 */
export function importMatterportCSV(csvText: string): MatterportImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rooms: Room[] = [];
  
  try {
    // Parse CSV
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      errors.push('No data rows found in CSV');
      return {
        success: false,
        errors,
        warnings,
        metadata: {
          rowsProcessed: 0,
          roomsImported: 0,
          rejectedRows: 0
        }
      };
    }
    
    // Map each row
    let rejectedRows = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const { room, error } = mapRowToRoom(rows[i], i);
      
      if (error) {
        if (error.includes('Missing or invalid')) {
          errors.push(error);
          rejectedRows++;
        } else {
          warnings.push(error);
          if (room) rooms.push(room);
        }
      } else if (room) {
        rooms.push(room);
      }
    }
    
    // Validate we got at least one room
    if (rooms.length === 0) {
      errors.push('No valid rooms could be imported from CSV');
      return {
        success: false,
        errors,
        warnings,
        metadata: {
          rowsProcessed: rows.length,
          roomsImported: 0,
          rejectedRows
        }
      };
    }
    
    // Create dimension input
    const dimensionInput: DimensionInput = {
      rooms,
      sourceType: 'MATTERPORT',
      metadata: {
        projectName: 'Matterport Import',
        dateCreated: new Date().toISOString()
      }
    };
    
    return {
      success: true,
      dimensionInput,
      errors,
      warnings,
      metadata: {
        rowsProcessed: rows.length,
        roomsImported: rooms.length,
        rejectedRows
      }
    };
    
  } catch (error: any) {
    errors.push(`CSV parsing failed: ${error.message}`);
    return {
      success: false,
      errors,
      warnings,
      metadata: {
        rowsProcessed: 0,
        roomsImported: 0,
        rejectedRows: 0
      }
    };
  }
}

/**
 * Validate Matterport import result
 */
export function validateMatterportImport(result: MatterportImportResult): { valid: boolean; message: string } {
  if (!result.success) {
    return {
      valid: false,
      message: `Import failed: ${result.errors.join(', ')}`
    };
  }
  
  if (!result.dimensionInput || result.dimensionInput.rooms.length === 0) {
    return {
      valid: false,
      message: 'No rooms imported'
    };
  }
  
  if (result.metadata.rejectedRows > result.metadata.roomsImported) {
    return {
      valid: false,
      message: `More rows rejected (${result.metadata.rejectedRows}) than imported (${result.metadata.roomsImported})`
    };
  }
  
  return {
    valid: true,
    message: `Successfully imported ${result.metadata.roomsImported} room(s)`
  };
}

/**
 * Create sample Matterport CSV template
 */
export function generateMatterportTemplate(): string {
  return `roomName,length,width,height
Living Room,20,15,8
Kitchen,12,10,8
Master Bedroom,16,14,8
Bathroom,8,6,8`;
}
