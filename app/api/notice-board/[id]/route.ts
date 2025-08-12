import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication and viewing tracking
    const user = await getUserContext(request);

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      const roleForBackend =
        user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
          ? 'admin'
          : user.role;

      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = roleForBackend;
      headers['x-user-access-level'] = user.accessLevel;
      // Preserve original role in case backend evolves to use it
      headers['x-user-role-name'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch notice' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching notice:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching notice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication and audit trail
    const user = await getUserContext(request);
    
    console.log('🔍 [EDIT-NOTICE] getUserContext result:', user);
    
    if (!user) {
      console.log('❌ [EDIT-NOTICE] No user context found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug logging
    console.log('🔐 [EDIT-NOTICE] User context:', { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      accessLevel: user.accessLevel 
    });

    // Only super admins, department admins, or admin role can edit notices
    const hasEditPermission = 
      user.accessLevel === 'super_admin' || 
      user.accessLevel === 'department_admin' ||
      user.role === 'admin'; // Fallback for backward compatibility
    
    if (!hasEditPermission) {
      console.log('🚫 [EDIT-NOTICE] Access denied:', { 
        accessLevel: user.accessLevel, 
        role: user.role,
        hasEditPermission 
      });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    console.log('✅ [EDIT-NOTICE] Access granted for user:', user.email);
    
    const body = await request.json();

    // Sanitize payload for backend validation
    const sanitizedBody: Record<string, any> = { ...body };
    // Remove empty-string optional fields
    if (sanitizedBody.linkUrl === '') delete sanitizedBody.linkUrl;
    if (sanitizedBody.fileName === '') delete sanitizedBody.fileName;
    if (sanitizedBody.fileType === '') delete sanitizedBody.fileType;
    // Ensure arrays are omitted when empty for optional fields
    if (Array.isArray(sanitizedBody.targetDepartments) && sanitizedBody.targetDepartments.length === 0) {
      delete sanitizedBody.targetDepartments;
    }
    if (Array.isArray(sanitizedBody.targetRoles) && sanitizedBody.targetRoles.length === 0) {
      delete sanitizedBody.targetRoles;
    }
    if (Array.isArray(sanitizedBody.tags) && sanitizedBody.tags.length === 0) {
      // keep empty tags if backend allows; if not, uncomment next line
      // delete sanitizedBody.tags;
    }
    // Normalize expiresAt to ISO string if provided
    if (sanitizedBody.expiresAt) {
      try {
        const dateValue = new Date(sanitizedBody.expiresAt);
        if (!isNaN(dateValue.getTime())) {
          sanitizedBody.expiresAt = dateValue.toISOString();
        } else {
          delete sanitizedBody.expiresAt; // invalid date
        }
      } catch {
        delete sanitizedBody.expiresAt;
      }
    }
    // If type is text, ensure no link/file metadata is sent
    if (sanitizedBody.type === 'text') {
      delete sanitizedBody.linkUrl;
      delete sanitizedBody.fileName;
      delete sanitizedBody.fileType;
    }

    // Enhance the request body with user information for audit trail
    const enhancedBody = {
      ...sanitizedBody,
      // Add user information for tracking who made the update
      updatedBy: user.id,
      updatedByName: user.name,
      updatedByRole: user.role,
      updatedByEmail: user.email,
      updatedByDepartment: user.department,
      updatedByAccessLevel: user.accessLevel,
      // Add timestamp
      updatedAt: new Date().toISOString(),
    };

    console.log('📝 [EDIT-NOTICE] Enhanced body with user info:', {
      originalBody: body,
      sanitizedBody: sanitizedBody,
      enhancedBody: enhancedBody,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
        accessLevel: user.accessLevel
      }
    });

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      const roleForBackend =
        user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
          ? 'admin'
          : user.role;

      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = roleForBackend;
      headers['x-user-access-level'] = user.accessLevel;
      headers['x-user-role-name'] = user.role;
    }

    console.log('📤 [EDIT-NOTICE] Sending to backend:', {
      url: `${SERVER_BASE_URL}/api/notice-board/${id}`,
      headers: headers,
      body: enhancedBody
    });

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(enhancedBody),
    });

    const errorText = !response.ok ? await response.text().catch(() => '') : '';
    console.log('📥 [EDIT-NOTICE] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: errorText || 'Unknown error' };
      }
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update notice' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating notice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication
    const user = await getUserContext(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins, department admins, or admin role can delete notices
    const hasDeletePermission = 
      user.accessLevel === 'super_admin' || 
      user.accessLevel === 'department_admin' ||
      user.role === 'admin'; // Fallback for backward compatibility
    
    if (!hasDeletePermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      const roleForBackend =
        user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
          ? 'admin'
          : user.role;

      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = roleForBackend;
      headers['x-user-access-level'] = user.accessLevel;
      headers['x-user-role-name'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete notice' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting notice' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins, department admins, or admin role can modify notice status
    const hasManagePermission = 
      user.accessLevel === 'super_admin' || 
      user.accessLevel === 'department_admin' ||
      user.role === 'admin'; // Fallback for backward compatibility
    
    if (!hasManagePermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      const roleForBackend =
        user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
          ? 'admin'
          : user.role;

      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = roleForBackend;
      headers['x-user-access-level'] = user.accessLevel;
      headers['x-user-role-name'] = user.role;
    }

    // Determine the specific PATCH endpoint
    let endpoint = `${SERVER_BASE_URL}/api/notice-board/${id}`;
    
    // Check if this is a publish/unpublish request
    if (url.pathname.endsWith('/publish')) {
      endpoint = `${SERVER_BASE_URL}/api/notice-board/${id}/publish`;
    }

    // Forward request to backend server
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update notice' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating notice' },
      { status: 500 }
    );
  }
}