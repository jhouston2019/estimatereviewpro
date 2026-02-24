/**
 * SECURITY GUARDS
 * ENTERPRISE-GRADE: Input sanitization, validation, threat prevention
 * Protects against malicious uploads and injection attacks
 */

import { SecurityError, FileError } from './structured-errors';
import * as path from 'path';

export const SECURITY_CONFIG = {
  ALLOWED_FILE_TYPES: ['pdf', 'txt', 'csv', 'jpg', 'jpeg', 'png'],
  ALLOWED_MIME_TYPES: {
    'pdf': ['application/pdf'],
    'txt': ['text/plain'],
    'csv': ['text/csv', 'text/plain'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png']
  },
  MAX_FILENAME_LENGTH: 255,
  BLOCKED_PATTERNS: [
    /\.\./,           // Directory traversal
    /[<>:"|?*]/,      // Windows invalid chars
    /^[\.]/,          // Hidden files
    /\x00/,           // Null bytes
    /[\x00-\x1F]/,    // Control characters
    /\.exe$/i,        // Executables
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.ps1$/i,
    /\.dll$/i,
    /\.so$/i
  ]
};

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || filename.trim().length === 0) {
    throw new SecurityError(
      'INVALID_FILENAME',
      'Filename is empty',
      'Provide a valid filename.'
    );
  }
  
  // Remove path separators
  let sanitized = path.basename(filename);
  
  // Check length
  if (sanitized.length > SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
    throw new SecurityError(
      'FILENAME_TOO_LONG',
      `Filename exceeds maximum length of ${SECURITY_CONFIG.MAX_FILENAME_LENGTH} characters`,
      'Use a shorter filename.',
      { length: sanitized.length, max: SECURITY_CONFIG.MAX_FILENAME_LENGTH }
    );
  }
  
  // Check for blocked patterns
  for (const pattern of SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new SecurityError(
        'INVALID_FILENAME_PATTERN',
        'Filename contains invalid or dangerous characters',
        'Use only alphanumeric characters, hyphens, underscores, and a valid extension.',
        { filename: sanitized, pattern: pattern.toString() }
      );
    }
  }
  
  // Check extension
  const ext = sanitized.split('.').pop()?.toLowerCase();
  
  if (!ext || !SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(ext)) {
    throw new SecurityError(
      'INVALID_FILE_EXTENSION',
      `File extension ".${ext}" is not allowed`,
      `Allowed extensions: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`,
      { extension: ext, allowed: SECURITY_CONFIG.ALLOWED_FILE_TYPES }
    );
  }
  
  return sanitized;
}

/**
 * Validate MIME type
 */
export function validateMimeType(buffer: Buffer, filename: string): void {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (!ext) {
    throw new SecurityError(
      'MISSING_FILE_EXTENSION',
      'File has no extension',
      'Provide a file with a valid extension.'
    );
  }
  
  // Get expected MIME types
  const expectedMimes = SECURITY_CONFIG.ALLOWED_MIME_TYPES[ext as keyof typeof SECURITY_CONFIG.ALLOWED_MIME_TYPES];
  
  if (!expectedMimes) {
    throw new SecurityError(
      'UNSUPPORTED_FILE_TYPE',
      `File type ".${ext}" is not supported`,
      `Supported types: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`,
      { extension: ext }
    );
  }
  
  // Detect MIME type from magic bytes
  const detectedMime = detectMimeType(buffer);
  
  if (detectedMime && !expectedMimes.includes(detectedMime)) {
    throw new SecurityError(
      'MIME_TYPE_MISMATCH',
      `File MIME type "${detectedMime}" does not match extension ".${ext}"`,
      'Ensure file extension matches actual file type. Do not rename file extensions.',
      { detected: detectedMime, expected: expectedMimes, extension: ext }
    );
  }
}

/**
 * Detect MIME type from magic bytes
 */
function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  
  // PDF
  if (buffer.toString('utf8', 0, 4) === '%PDF') {
    return 'application/pdf';
  }
  
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // Text/CSV (no reliable magic bytes - check for printable ASCII)
  const sample = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  if (/^[\x20-\x7E\r\n\t]+$/.test(sample)) {
    return 'text/plain';
  }
  
  return null;
}

/**
 * Check for executable content in buffer
 */
export function checkForExecutableContent(buffer: Buffer, filename: string): void {
  // Check for PE header (Windows executable)
  if (buffer.length > 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    throw new SecurityError(
      'EXECUTABLE_DETECTED',
      'File contains executable content (PE header)',
      'Executable files are not allowed.',
      { filename }
    );
  }
  
  // Check for ELF header (Linux executable)
  if (buffer.length > 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    throw new SecurityError(
      'EXECUTABLE_DETECTED',
      'File contains executable content (ELF header)',
      'Executable files are not allowed.',
      { filename }
    );
  }
  
  // Check for Mach-O header (macOS executable)
  if (buffer.length > 4 && 
      ((buffer[0] === 0xFE && buffer[1] === 0xED && buffer[2] === 0xFA) ||
       (buffer[0] === 0xCF && buffer[1] === 0xFA && buffer[2] === 0xED))) {
    throw new SecurityError(
      'EXECUTABLE_DETECTED',
      'File contains executable content (Mach-O header)',
      'Executable files are not allowed.',
      { filename }
    );
  }
  
  // Check for script shebangs
  const header = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  if (header.startsWith('#!')) {
    throw new SecurityError(
      'SCRIPT_DETECTED',
      'File contains script content (shebang detected)',
      'Script files are not allowed.',
      { filename }
    );
  }
}

/**
 * Sanitize CSV input
 */
export function sanitizeCSV(csvText: string): string {
  // Remove null bytes
  let sanitized = csvText.replace(/\x00/g, '');
  
  // Remove control characters except newline, carriage return, tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit line length to prevent DoS
  const lines = sanitized.split('\n');
  const sanitizedLines = lines.map(line => 
    line.length > 10000 ? line.substring(0, 10000) : line
  );
  
  return sanitizedLines.join('\n');
}

/**
 * Sanitize text input
 */
export function sanitizeTextInput(text: string): string {
  if (!text) return '';
  
  // Remove null bytes
  let sanitized = text.replace(/\x00/g, '');
  
  // Remove control characters except newline, carriage return, tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit total length
  if (sanitized.length > 1000000) { // 1MB text
    sanitized = sanitized.substring(0, 1000000);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize file upload
 */
export function validateAndSanitizeUpload(
  buffer: Buffer,
  filename: string,
  maxSizeMB: number = 10
): { sanitizedFilename: string; validatedBuffer: Buffer } {
  
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);
  
  // Validate size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    throw new FileError(
      'FILE_TOO_LARGE',
      `File size ${sizeMB.toFixed(2)} MB exceeds maximum ${maxSizeMB} MB`,
      `Reduce file size to under ${maxSizeMB} MB.`,
      { sizeMB, maxSizeMB }
    );
  }
  
  // Check for empty
  if (buffer.length === 0) {
    throw new FileError(
      'EMPTY_FILE',
      'Uploaded file is empty',
      'Provide a valid file with content.'
    );
  }
  
  // Validate MIME type
  validateMimeType(buffer, sanitizedFilename);
  
  // Check for executable content
  checkForExecutableContent(buffer, sanitizedFilename);
  
  return {
    sanitizedFilename,
    validatedBuffer: buffer
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(req: any): string {
  // Check for proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address
  return req.socket?.remoteAddress || 'unknown';
}
