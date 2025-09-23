import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { 
  parseExcelFile, 
  validateExcelStructure, 
  validateRowData,
  validateFileUpload,
  excelUploadRateLimit,
  ASSET_EXCEL_SCHEMA 
} from '@/lib/excel-validation';

/**
 * POST /api/assets/excel-upload/validate
 * Validates Excel file structure and data without creating assets
 * 
 * Security Features:
 * - JWT authentication required
 * - Rate limiting (5 uploads per minute per user)
 * - File size and type validation
 * - Comprehensive data validation
 * - No SQL injection risk (validation only)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check (CRITICAL)
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // 2. Authorization check - only admins can bulk import assets
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions. Only administrators can import assets.',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // 3. Rate limiting (DoS protection)
    const rateLimitResult = excelUploadRateLimit.check(request, user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many upload attempts. Please wait before trying again.',
          code: 'RATE_LIMITED',
          retryAfter: rateLimitResult.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // 4. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No file provided',
          code: 'NO_FILE' 
        },
        { status: 400 }
      );
    }

    // 5. File security validation
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: fileValidation.error,
          code: 'INVALID_FILE' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 [Excel Validation] User ${user.email} uploading file: ${file.name} (${file.size} bytes)`);

    // 6. Parse Excel file
    const fileBuffer = await file.arrayBuffer();
    const parseResult = await parseExcelFile(fileBuffer);
    if (!parseResult.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: parseResult.error,
          code: 'PARSE_ERROR' 
        },
        { status: 400 }
      );
    }

    const { headers, rows } = parseResult;

    // 7. Validate Excel structure
    const structureValidation = validateExcelStructure(headers!);
    if (!structureValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: structureValidation.error,
          code: 'INVALID_STRUCTURE' 
        },
        { status: 400 }
      );
    }

    // 8. Validate each row
    const validationResults = rows!.map((row, index) => 
      validateRowData(row, headers!, index + 2) // Row numbers start from 2 (header is row 1)
    );

    // 9. Check for duplicate serial numbers within the file
    const serialNumbers = new Set<string>();
    const duplicateSerials: string[] = [];
    
    validationResults.forEach(result => {
      const serialNumber = result.data.serial_number?.toUpperCase();
      if (serialNumber) {
        if (serialNumbers.has(serialNumber)) {
          duplicateSerials.push(serialNumber);
          result.errors.push({
            field: 'serial_number',
            message: 'Duplicate serial number within the file',
            severity: 'error'
          });
          result.isValid = false;
        } else {
          serialNumbers.add(serialNumber);
        }
      }
    });

    // 10. Summary statistics
    const totalRows = validationResults.length;
    const validRows = validationResults.filter(r => r.isValid).length;
    const errorRows = totalRows - validRows;
    const warnings = validationResults.reduce((acc, r) => 
      acc + r.errors.filter(e => e.severity === 'warning').length, 0
    );

    console.log(`✅ [Excel Validation] Completed - Total: ${totalRows}, Valid: ${validRows}, Errors: ${errorRows}, Warnings: ${warnings}`);

    // 11. Return validation results
    return NextResponse.json({
      success: true,
      message: 'File validated successfully',
      data: {
        summary: {
          totalRows,
          validRows,
          errorRows,
          warnings,
          canProceed: errorRows === 0
        },
        schema: ASSET_EXCEL_SCHEMA.map(col => ({
          key: col.key,
          header: col.header,
          required: col.required,
          type: col.type
        })),
        validationResults,
        structureWarning: structureValidation.warning
      }
    });

  } catch (error) {
    console.error('❌ [Excel Validation] Error:', error);
    
    // Never expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during validation',
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}
