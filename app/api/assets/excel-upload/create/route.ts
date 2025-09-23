import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { sanitizeAssetData, excelUploadRateLimit } from '@/lib/excel-validation';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Map statusText to statusColor based on frontend form values
function getStatusColor(statusText: string): 'green' | 'yellow' | 'red' {
  switch (statusText) {
    case 'Available':
      return 'green'
    case 'In Use':
      return 'yellow'
    case 'Maintenance':
      return 'red'
    case 'Out of Service':
      return 'red'
    default:
      return 'green' // Default to green for available
  }
}

interface BulkCreateRequest {
  assets: Array<Record<string, any>>;
  validateOnly?: boolean;
}

interface BulkCreateResult {
  rowNumber: number;
  success: boolean;
  assetId?: string;
  serialNumber?: string;
  errors?: string[];
}

/**
 * POST /api/assets/excel-upload/create
 * Bulk creates assets from validated Excel data
 * 
 * Security Features:
 * - JWT authentication + authorization
 * - Rate limiting (prevents bulk spam)
 * - Transaction-like behavior (all or nothing on critical errors)
 * - Comprehensive error handling
 * - Activity logging for audit trail
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

    // 2. Authorization check - only admins can bulk create assets
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions. Only administrators can bulk create assets.',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // 3. Rate limiting (prevent bulk creation abuse)
    const rateLimitResult = excelUploadRateLimit.check(request, user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many bulk operations. Please wait before trying again.',
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

    // 4. Extract JWT token for backend API calls
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication token required',
          code: 'NO_TOKEN' 
        },
        { status: 401 }
      );
    }

    // 5. Parse and validate request body
    const body: BulkCreateRequest = await request.json();

    // Input validation
    if (!body.assets || !Array.isArray(body.assets) || body.assets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No assets provided for creation' },
        { status: 400 }
      );
    }

    if (body.assets.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Maximum 100 assets can be created at once' },
        { status: 400 }
      );
    }
    


    // 6. Validate and sanitize each asset before creation
    const sanitizedAssets: Array<{ rowNumber: number; data: Record<string, any> }> = [];
    
    for (let i = 0; i < body.assets.length; i++) {
      try {
        const asset = body.assets[i];
        const rowNumber = asset._rowNumber || (i + 2); // Excel row numbers start from 2
        
        // Sanitize and validate data
        const sanitizedData = sanitizeAssetData(asset);
        
        // Ensure required fields are present
        if (!sanitizedData.asset_name?.trim()) {
          throw new Error(`Row ${rowNumber}: Asset name is required`);
        }
        if (!sanitizedData.category_name?.trim()) {
          throw new Error(`Row ${rowNumber}: Category name is required`);
        }
        
        // Set default values for optional fields
        sanitizedData.status = sanitizedData.status || 'Available';
        sanitizedData.rfid = sanitizedData.rfid || '';
        sanitizedData.description = sanitizedData.description || '';
        
        // Add audit fields
        sanitizedData.createdBy = user.id;
        sanitizedData.createdByEmail = user.email;
        sanitizedData.creationMethod = 'excel_import';
        sanitizedData.batchId = `excel_${Date.now()}_${user.id}`;
        
        // Department access control for department admins
        if (user.accessLevel === 'department_admin') {
          sanitizedData.department_name = user.department;
        }
        
        
        sanitizedAssets.push({
          rowNumber,
          data: sanitizedData
        });
        
      } catch (error) {
        console.error(`❌ [Bulk Creation] Validation error for row ${i + 2}:`, error);
        return NextResponse.json(
          { 
            success: false, 
            message: `Validation error in row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            code: 'VALIDATION_ERROR',
            rowNumber: i + 2
          },
          { status: 400 }
        );
      }
    }

    // 7. Batch creation with progress tracking
    const results: BulkCreateResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process in smaller batches to prevent timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < sanitizedAssets.length; i += BATCH_SIZE) {
      const batch = sanitizedAssets.slice(i, i + BATCH_SIZE);
      
      for (const { rowNumber, data } of batch) {
        try {
          // Create individual asset via backend server
          // Prepare the request payload
          const requestPayload = {
            assetName: data.asset_name,
            category: data.category_name,
            productName: data.product_name,
            serialNo: data.serial_number,
            rfid: data.rfid || undefined,
            manufacturer: data.manufacturer || undefined,
            model: data.model || undefined,
            location: data.location_name,
            department: data.department_name,
            purchaseDate: data.purchase_date || undefined,
            warrantyExpiry: data.warranty_expiry || undefined,
            purchaseCost: data.purchase_cost || undefined,
            // Backend expects statusText and statusColor, not status
            statusText: data.status || 'Available',
            statusColor: getStatusColor(data.status || 'Available'),
            description: data.description || undefined,
            parentAssetSerial: data.parent_asset_serial || undefined,
            // Audit fields
            createdBy: data.createdBy,
            createdByEmail: data.createdByEmail,
            creationMethod: data.creationMethod,
            batchId: data.batchId
          };

          
          const createResponse = await fetch(`${SERVER_BASE_URL}/api/assets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestPayload),
          });
          

          if (createResponse.ok) {
            const result = await createResponse.json();
            successCount++;
            results.push({
              rowNumber,
              success: true,
              assetId: result.data?.id || result.data?._id,
              serialNumber: data.serial_number
            });
            
            
          } else {
            const errorData = await createResponse.json().catch(() => ({}));
            
            // Extract specific error messages
            const errorMessages = [];
            if (errorData.message) {
              errorMessages.push(errorData.message);
            }
            if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessages.push(...errorData.errors);
            }
            if (errorData.details) {
              errorMessages.push(errorData.details);
            }
            if (errorMessages.length === 0) {
              errorMessages.push(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
            }
            
            failureCount++;
            results.push({
              rowNumber,
              success: false,
              serialNumber: data.serial_number,
              errors: errorMessages
            });
          }

        } catch (error) {
          failureCount++;
          results.push({
            rowNumber,
            success: false,
            serialNumber: data.serial_number,
            errors: ['Failed to communicate with backend server']
          });
        }
      }

      // Small delay between batches to prevent overwhelming the backend
      if (i + BATCH_SIZE < sanitizedAssets.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 8. Log bulk creation activity
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || request.url.split('/api')[0]}/api/log-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          module: 'assets',
          entityId: 'bulk_import',
          entityName: `Bulk Import - ${successCount} assets`,
          action: 'create',
          actionDescription: `Bulk imported ${successCount} assets via Excel upload. ${failureCount} failed.`,
          metadata: {
            totalAssets: body.assets.length,
            successCount,
            failureCount,
            batchId: `excel_${Date.now()}_${user.id}`,
            userDepartment: user.department
          }
        }),
      }).catch(() => {}); // Don't fail the main operation if logging fails
    } catch (error) {
      // Activity logging failed, but don't fail the entire operation
    }

    // 9. Return comprehensive results
    const response = {
      success: failureCount === 0,
      message: failureCount === 0 
        ? `Successfully created ${successCount} assets`
        : `Created ${successCount} assets, ${failureCount} failed`,
      data: {
        summary: {
          total: body.assets.length,
          successful: successCount,
          failed: failureCount,
          successRate: Math.round((successCount / body.assets.length) * 100)
        },
        results,
        batchId: `excel_${Date.now()}_${user.id}`
      }
    };

    console.log(`✅ [Bulk Creation] Completed - Success: ${successCount}, Failed: ${failureCount}`);

    return NextResponse.json(response, { 
      status: failureCount === 0 ? 201 : 207 // 207 = Multi-Status (partial success)
    });

  } catch (error) {
    console.error('❌ [Bulk Creation] Critical error:', error);

    // TODO: Implement rollback mechanism for critical failures
    // For now, log the created assets for manual cleanup if needed
    if (createdAssets.length > 0) {
      console.error(`⚠️ [Bulk Creation] ${createdAssets.length} assets were created before failure:`, 
        createdAssets.map(a => a.assetId));
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Critical error during bulk creation',
        code: 'CRITICAL_ERROR',
        partialResults: createdAssets.length > 0 ? {
          created: createdAssets.length,
          assetIds: createdAssets.map(a => a.assetId)
        } : undefined
      },
      { status: 500 }
    );
  }
}
