# ERROR CODES

**Version:** 1.0.0  
**Last Updated:** 2026-02-10

---

## ERROR FORMAT

All errors follow this structure:
```json
{
  "errorCode": "SPECIFIC_ERROR_CODE",
  "errorType": "VALIDATION_ERROR | PARSE_ERROR | CALCULATION_ERROR | ...",
  "message": "Human-readable error description",
  "remediation": "Actionable guidance for fixing the error",
  "timestamp": "2026-02-10T12:34:56.789Z",
  "details": { "field": "value" },
  "field": "optional.field.path"
}
```

---

## VALIDATION ERRORS

### LOW_PARSE_CONFIDENCE
- **Type:** VALIDATION_ERROR
- **Message:** Parse confidence X% below minimum threshold (75%)
- **Remediation:** Verify estimate format is Xactimate standard. Check for malformed columns, missing headers, or corrupted data.
- **Details:** `{ confidence, threshold }`

### NO_LINE_ITEMS
- **Type:** VALIDATION_ERROR
- **Message:** Estimate contains no parseable line items
- **Remediation:** Verify estimate file contains trade codes, quantities, and prices in standard format.

### INVALID_RCV
- **Type:** VALIDATION_ERROR
- **Message:** Total RCV is invalid: X
- **Remediation:** Verify estimate contains valid pricing data.
- **Details:** `{ rcv }`

### INVALID_QUANTITY
- **Type:** VALIDATION_ERROR
- **Message:** Line item X has invalid quantity: Y
- **Remediation:** Check estimate formatting and ensure quantities are numeric.
- **Details:** `{ lineItem, quantity }`

### NO_ROOMS
- **Type:** VALIDATION_ERROR
- **Message:** Dimension input contains no rooms
- **Remediation:** Provide at least one room with length, width, and height dimensions.

### INVALID_ROOM_DIMENSIONS
- **Type:** VALIDATION_ERROR
- **Message:** Room "X" has invalid Y: Z
- **Remediation:** Y must be a positive number in feet.
- **Details:** `{ roomName, field, value }`

### DIMENSIONS_REQUIRED
- **Type:** VALIDATION_ERROR
- **Message:** Dimension data required for report directive comparison
- **Remediation:** Provide room dimensions (length, width, height) to enable height-based deviation calculations.

### MISSING_ROOM_NAME
- **Type:** VALIDATION_ERROR
- **Message:** Room X is missing a name
- **Remediation:** Provide a descriptive name for each room.

### INVALID_ROOM_LENGTH
- **Type:** VALIDATION_ERROR
- **Message:** Room "X" has invalid length: Y
- **Remediation:** Length must be a positive number in feet.

### INVALID_ROOM_WIDTH
- **Type:** VALIDATION_ERROR
- **Message:** Room "X" has invalid width: Y
- **Remediation:** Width must be a positive number in feet.

### INVALID_ROOM_HEIGHT
- **Type:** VALIDATION_ERROR
- **Message:** Room "X" has invalid height: Y
- **Remediation:** Height must be a positive number in feet.

### NAN_DIMENSION
- **Type:** VALIDATION_ERROR
- **Message:** Room "X" contains NaN values
- **Remediation:** Ensure all dimensions are valid numbers.

### RISK_SCORE_OUT_OF_RANGE
- **Type:** VALIDATION_ERROR
- **Message:** Risk score X is outside valid range (0-100)
- **Remediation:** Internal error - score must be capped at 0-100.

---

## DIMENSION ERRORS

### ZERO_PERIMETER
- **Type:** DIMENSION_ERROR
- **Message:** Room "X" has zero perimeter
- **Remediation:** Check room length and width values. Both must be > 0.
- **Details:** `{ roomName }`

### INVALID_PERIMETER
- **Type:** DIMENSION_ERROR
- **Message:** Perimeter must be > 0 (got X)
- **Remediation:** Check dimension data for validity.
- **Details:** `{ perimeter }`

---

## CALCULATION ERRORS

### HEIGHT_EXCEEDS_CEILING
- **Type:** CALCULATION_ERROR
- **Message:** Extracted height X ft exceeds ceiling height Y ft in room "Z"
- **Remediation:** This indicates ceiling removal may be included in wall removal quantity. Separate wall and ceiling line items, or verify dimension data is correct.
- **Details:** `{ extractedHeight, maxHeight, roomName }`

### NEGATIVE_DELTA
- **Type:** CALCULATION_ERROR
- **Message:** Delta SF for X is negative (Y)
- **Remediation:** This should not happen - internal calculation error. Contact support.
- **Details:** `{ trade, deltaSF }`

### INVALID_EXPOSURE_RANGE
- **Type:** CALCULATION_ERROR
- **Message:** Min exposure ($X) exceeds max exposure ($Y)
- **Remediation:** Internal calculation error. Contact support.
- **Details:** `{ min, max }`

### INSUFFICIENT_DATA
- **Type:** CALCULATION_ERROR
- **Message:** Quantity must be > 0 (got X)
- **Remediation:** Provide valid quantity data.
- **Details:** `{ quantity }`

---

## FILE ERRORS

### FILE_TOO_LARGE
- **Type:** FILE_ERROR
- **Message:** File size X MB exceeds maximum Y MB
- **Remediation:** Reduce file size to under Y MB or split into multiple files.
- **Details:** `{ sizeMB, maxMB }`

### INVALID_FILE_TYPE
- **Type:** FILE_ERROR
- **Message:** File type ".X" not allowed
- **Remediation:** Allowed types: pdf, txt, csv, jpg, jpeg, png
- **Details:** `{ extension, allowed }`

### EMPTY_FILE
- **Type:** FILE_ERROR
- **Message:** Uploaded file is empty
- **Remediation:** Provide a valid file with content.

### INVALID_FILENAME
- **Type:** FILE_ERROR
- **Message:** Filename is empty
- **Remediation:** Provide a valid filename.

### FILENAME_TOO_LONG
- **Type:** FILE_ERROR
- **Message:** Filename exceeds maximum length of 255 characters
- **Remediation:** Use a shorter filename.
- **Details:** `{ length, max }`

---

## SECURITY ERRORS

### DIRECTORY_TRAVERSAL
- **Type:** SECURITY_ERROR
- **Message:** Filename contains invalid characters (directory traversal attempt)
- **Remediation:** Use simple filename without path separators.
- **Details:** `{ filename }`

### INVALID_FILENAME_PATTERN
- **Type:** SECURITY_ERROR
- **Message:** Filename contains invalid or dangerous characters
- **Remediation:** Use only alphanumeric characters, hyphens, underscores, and a valid extension.
- **Details:** `{ filename, pattern }`

### INVALID_FILE_EXTENSION
- **Type:** SECURITY_ERROR
- **Message:** File extension ".X" is not allowed
- **Remediation:** Allowed extensions: pdf, txt, csv, jpg, jpeg, png
- **Details:** `{ extension, allowed }`

### MIME_TYPE_MISMATCH
- **Type:** SECURITY_ERROR
- **Message:** File MIME type "X" does not match extension ".Y"
- **Remediation:** Ensure file extension matches actual file type. Do not rename file extensions.
- **Details:** `{ detected, expected, extension }`

### EXECUTABLE_DETECTED
- **Type:** SECURITY_ERROR
- **Message:** File contains executable content (PE/ELF/Mach-O header)
- **Remediation:** Executable files are not allowed.
- **Details:** `{ filename }`

### SCRIPT_DETECTED
- **Type:** SECURITY_ERROR
- **Message:** File contains script content (shebang detected)
- **Remediation:** Script files are not allowed.
- **Details:** `{ filename }`

### UNSUPPORTED_FILE_TYPE
- **Type:** SECURITY_ERROR
- **Message:** File type ".X" is not supported
- **Remediation:** Supported types: pdf, txt, csv, jpg, jpeg, png
- **Details:** `{ extension }`

### MISSING_FILE_EXTENSION
- **Type:** SECURITY_ERROR
- **Message:** File has no extension
- **Remediation:** Provide a file with a valid extension.

---

## PERFORMANCE ERRORS

### TIMEOUT_EXCEEDED
- **Type:** PERFORMANCE_ERROR
- **Message:** Operation "X" exceeded timeout of Y ms
- **Remediation:** Try with a smaller file or simpler estimate. Contact support if issue persists.
- **Details:** `{ operation, timeoutMs }`

### PROCESSING_TIMEOUT
- **Type:** PERFORMANCE_ERROR
- **Message:** Total processing time X ms exceeded maximum Y ms
- **Remediation:** Try with a smaller file or simpler estimate.
- **Details:** `{ elapsedMs, maxMs }`

### RATE_LIMIT_EXCEEDED
- **Type:** PERFORMANCE_ERROR
- **Message:** Too many requests. Please try again later.
- **Remediation:** Rate limit: 10 requests per minute. Retry in X seconds.
- **Details:** `{ remaining, resetMs, resetSeconds }`

### TOO_MANY_ROOMS
- **Type:** PERFORMANCE_ERROR
- **Message:** Room count X exceeds maximum Y
- **Remediation:** For properties with more than 50 rooms, contact enterprise support for custom processing.
- **Details:** `{ roomCount, maxRooms }`

### TOO_MANY_LINE_ITEMS
- **Type:** PERFORMANCE_ERROR
- **Message:** Line item count X exceeds maximum Y
- **Remediation:** For estimates with more than 1000 line items, contact enterprise support.
- **Details:** `{ count, maxItems }`

### TOO_MANY_PHOTOS
- **Type:** PERFORMANCE_ERROR
- **Message:** Photo count X exceeds maximum Y
- **Remediation:** Limit photo uploads to Y images per request.
- **Details:** `{ count, maxPhotos }`

---

## PARSE ERRORS

### MALFORMED_ESTIMATE
- **Type:** PARSE_ERROR
- **Message:** Unable to detect column structure in estimate
- **Remediation:** Verify estimate is in standard Xactimate format with aligned columns.

### COLUMN_SHIFT_DETECTED
- **Type:** PARSE_ERROR
- **Message:** Column alignment shifts detected in estimate
- **Remediation:** Export estimate as fixed-width text or PDF to preserve column alignment.

### INSUFFICIENT_CSV_DATA
- **Type:** PARSE_ERROR
- **Message:** CSV file must contain at least a header row and one data row
- **Remediation:** Verify CSV file is not truncated.

### EMPTY_CSV
- **Type:** PARSE_ERROR
- **Message:** CSV file is empty
- **Remediation:** Provide a valid CSV file with headers and data rows.

---

## INTERNAL ERRORS

### INTERNAL_ERROR
- **Type:** INTERNAL_ERROR
- **Message:** An unexpected error occurred
- **Remediation:** Please contact support with the request ID.
- **Details:** `{ name, stack (dev only) }`

---

## HTTP STATUS CODES

| Code | Meaning | Error Types |
|------|---------|-------------|
| 400 | Bad Request | VALIDATION_ERROR, PARSE_ERROR |
| 413 | Payload Too Large | FILE_TOO_LARGE |
| 422 | Unprocessable Entity | CALCULATION_ERROR, DIMENSION_ERROR |
| 429 | Too Many Requests | RATE_LIMIT_EXCEEDED |
| 500 | Internal Server Error | INTERNAL_ERROR |
| 503 | Service Unavailable | PERFORMANCE_ERROR (timeout) |

---

## ERROR HANDLING FLOW

```
REQUEST
  ↓
TRY
  ↓
VALIDATION
  ├─ ValidationError → 400
  ├─ FileError → 400/413
  └─ SecurityError → 400/403
  ↓
PARSING
  └─ ParseError → 400
  ↓
CALCULATION
  ├─ DimensionError → 422
  ├─ CalculationError → 422
  └─ PerformanceError → 429/503
  ↓
SUCCESS
CATCH
  ↓
STRUCTURED ERROR
  ↓
LOG TO TELEMETRY
  ↓
RETURN { success: false, error: {...} }
```

---

## DEBUGGING

### How to Debug an Error

1. **Check Error Code:** Identifies specific failure point
2. **Read Remediation:** Actionable fix guidance
3. **Check Details:** Field-specific context
4. **Check Audit Trail:** Full calculation history
5. **Check Telemetry:** Historical patterns

### Example Debug Flow

**Error:** `HEIGHT_EXCEEDS_CEILING`

1. **Error Code:** `HEIGHT_EXCEEDS_CEILING`
2. **Details:** `{ extractedHeight: 10.5, maxHeight: 8, roomName: "Living Room" }`
3. **Audit Trail:** Check `geometryCalculations` for formula
4. **Root Cause:** Ceiling removal included in wall removal quantity
5. **Fix:** Separate wall and ceiling line items in estimate

---

## SUPPORT

For unresolved errors:
1. Collect request ID
2. Collect error code
3. Collect audit trail
4. Contact support with full context

---

## APPENDIX: COMMON ERROR SCENARIOS

### Scenario 1: Low Parse Confidence
**Error:** `LOW_PARSE_CONFIDENCE`  
**Cause:** Malformed columns, missing headers, non-standard format  
**Fix:** Export estimate as fixed-width text or PDF

### Scenario 2: Height Exceeds Ceiling
**Error:** `HEIGHT_EXCEEDS_CEILING`  
**Cause:** Ceiling included in wall removal quantity  
**Fix:** Separate wall and ceiling line items

### Scenario 3: Zero Perimeter
**Error:** `ZERO_PERIMETER`  
**Cause:** Invalid room dimensions (length or width = 0)  
**Fix:** Verify dimension data accuracy

### Scenario 4: Dimensions Required
**Error:** `DIMENSIONS_REQUIRED`  
**Cause:** Expert report provided without dimension data  
**Fix:** Upload dimension data (Matterport CSV or manual entry)

### Scenario 5: Rate Limit Exceeded
**Error:** `RATE_LIMIT_EXCEEDED`  
**Cause:** More than 10 requests per minute  
**Fix:** Wait and retry after reset time
