import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

/**
 * PATCH /api/notice-board/[id]/publish
 * 
 * Publishes or unpublishes a notice board entry
 * 
 * Security Requirements:
 * - JWT authentication required
 * - Only administrators can publish/unpublish notices
 * - Input validation and sanitization
 * - Audit trail for all publish actions
 * 
 * @param request - NextRequest with JWT token and publish status
 * @param params - Route parameters containing notice ID
 * @returns JSON response with updated notice data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate notice ID format (MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid notice ID format',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required', 
          code: 'NO_TOKEN' 
        },
        { status: 401 }
      );
    }

    // Get user context for authorization and audit trail
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    // Authorization: Only administrators can publish/unpublish notices
    const hasPublishPermission = 
      user.accessLevel === 'super_admin' || 
      user.accessLevel === 'department_admin' ||
      user.role === 'admin';

    if (!hasPublishPermission) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Insufficient permissions. Only administrators can publish notices.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: { isPublished?: boolean };
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid JSON payload',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (typeof body.isPublished !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'isPublished field is required and must be a boolean',
          code: 'INVALID_PUBLISH_STATUS'
        },
        { status: 400 }
      );
    }

    // Prepare enhanced request body with audit information
    const enhancedBody = {
      isPublished: body.isPublished,
      // Add audit trail information
      publishedBy: user.id,
      publishedByName: user.name,
      publishedByRole: user.jobTitle || user.role,
      publishedByEmail: user.email,
      publishedByDepartment: user.department,
      publishedByAccessLevel: user.accessLevel,
      // Add timestamp
      publishedAt: body.isPublished ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Prepare headers with user context for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-email': user.email,
      'x-user-department': user.department,
      'x-user-role': user.role, // Already mapped correctly in JWT
      'x-user-access-level': user.accessLevel,
      'x-user-role-name': user.jobTitle || user.role,
    };

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board/${id}/publish`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    // Handle backend response
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text().catch(() => 'Unknown error');
        errorData = { message: errorText };
      }

      // Log security-related errors
      if (response.status === 401 || response.status === 403) {
        console.warn(`Security: Publish attempt failed for user ${user.email} on notice ${id}:`, {
          status: response.status,
          error: errorData.message,
          userRole: user.role,
          userAccessLevel: user.accessLevel
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to update notice publish status',
          code: 'BACKEND_ERROR'
        },
        { status: response.status }
      );
    }

    // Parse successful response
    const result = await response.json();
    
    // Log successful publish action for audit
    console.info(`Notice ${id} ${body.isPublished ? 'published' : 'unpublished'} by ${user.email} (${user.accessLevel})`);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in notice publish endpoint:', error);
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while updating notice publish status',
        ...(isDevelopment && { error: error instanceof Error ? error.message : 'Unknown error' })
      },
      { status: 500 }
    );
  }
}
