import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { sanitizeDataForDuplication, validateDuplicateName, checkNameExists, ASSET_DUPLICATION_CONFIG } from '@/lib/duplication-utils';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

/**
 * POST /api/assets/[id]/duplicate
 * Duplicates an asset with a new name
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: originalAssetId } = await params;

    // Get user context for authentication and authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions - only super admin and department admin can duplicate assets
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Only administrators can duplicate assets.' },
        { status: 403 }
      );
    }

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newAssetName } = body;

    console.log('🔄 [Asset Duplication] - Starting duplication for asset:', originalAssetId);
    console.log('🔄 [Asset Duplication] - New asset name:', newAssetName);

    // Validate the new asset name
    const nameValidation = validateDuplicateName(newAssetName);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { success: false, message: nameValidation.error },
        { status: 400 }
      );
    }

    // Check if the new name already exists
    const nameExists = await checkNameExists(newAssetName, 'assets');
    if (nameExists) {
      return NextResponse.json(
        { success: false, message: 'An asset with this name already exists. Please choose a different name.' },
        { status: 409 }
      );
    }

    // Fetch the original asset data
    console.log('🔍 [Asset Duplication] - Fetching original asset data');
    const originalAssetResponse = await fetch(`${SERVER_BASE_URL}/api/assets/${originalAssetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!originalAssetResponse.ok) {
      const errorData = await originalAssetResponse.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Original asset not found' },
        { status: originalAssetResponse.status }
      );
    }

    const originalAssetData = await originalAssetResponse.json();
    
    if (!originalAssetData.success || !originalAssetData.data) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve original asset data' },
        { status: 400 }
      );
    }

    console.log('✅ [Asset Duplication] - Original asset data retrieved');

    // Check department access if user is department admin
    if (user.accessLevel === 'department_admin' && 
        originalAssetData.data.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Asset not in your department.' },
        { status: 403 }
      );
    }

    // Sanitize and prepare data for duplication
    const sanitizedData = sanitizeDataForDuplication(
      originalAssetData.data, 
      ASSET_DUPLICATION_CONFIG
    );

    // Set the new asset name
    sanitizedData[ASSET_DUPLICATION_CONFIG.nameField] = newAssetName.trim();

    // Ensure department is set correctly for department admins
    if (user.accessLevel === 'department_admin') {
      sanitizedData.department = user.department;
    }

    // Add duplication metadata
    const duplicatedAssetData = {
      ...sanitizedData,
      // Add metadata to track duplication
      duplicatedFrom: originalAssetId,
      duplicatedAt: new Date().toISOString(),
      duplicatedBy: user.id,
      // Ensure these fields are properly set
      createdBy: user.id,
      isActive: 'Yes',
      deleted: 'No'
    };

    console.log('🔄 [Asset Duplication] - Prepared sanitized data for creation');
    console.log('🔄 [Asset Duplication] - Asset name:', duplicatedAssetData.assetName);
    console.log('🔄 [Asset Duplication] - Department:', duplicatedAssetData.department);

    // Create the new asset via backend API
    const createResponse = await fetch(`${SERVER_BASE_URL}/api/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(duplicatedAssetData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('❌ [Asset Duplication] - Failed to create duplicated asset:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to create duplicated asset',
          details: errorData.details || 'Unknown error occurred during asset creation'
        },
        { status: createResponse.status }
      );
    }

    const createdAssetResult = await createResponse.json();
    
    if (!createdAssetResult.success) {
      console.error('❌ [Asset Duplication] - Asset creation failed:', createdAssetResult);
      return NextResponse.json(
        { success: false, message: createdAssetResult.message || 'Failed to create duplicated asset' },
        { status: 400 }
      );
    }

    console.log('✅ [Asset Duplication] - Asset duplicated successfully');
    console.log('✅ [Asset Duplication] - New asset ID:', createdAssetResult.data?.id);

    // Return success response with the new asset data
    return NextResponse.json(
      {
        success: true,
        message: 'Asset duplicated successfully',
        data: {
          originalAssetId,
          newAsset: createdAssetResult.data,
          duplicatedFields: Object.keys(sanitizedData),
          excludedFields: ASSET_DUPLICATION_CONFIG.excludeFields
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ [Asset Duplication] - Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during asset duplication',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
