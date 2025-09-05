import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward request to backend with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board?${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Backend request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Notice Board API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract JWT token from the request (CRITICAL: Required for backend authentication)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Get user context for authorization and request enhancement
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // All authenticated users can create notices
    // (No additional role restrictions as requested)

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize tags array
    let sanitizedTags: string[] = [];
    if (body.tags && Array.isArray(body.tags)) {
      sanitizedTags = body.tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length >= 1 && tag.length <= 50)
        .slice(0, 10); // Limit to maximum 10 tags
    }

    // Validate other array fields
    const sanitizedTargetDepartments = Array.isArray(body.targetDepartments) 
      ? body.targetDepartments.filter((dept: any) => typeof dept === 'string' && dept.trim().length > 0)
      : [];
    
    const sanitizedTargetRoles = Array.isArray(body.targetRoles)
      ? body.targetRoles.filter((role: any) => typeof role === 'string' && role.trim().length > 0)
      : [];

    // Use the role directly as it's now properly mapped in JWT
    const roleForBackend = user.role;

    // Transform the request body to match backend expectations
    const enhancedBody = {
      title: body.title,
      content: body.content, // CRITICAL: Backend expects 'content' field based on validation error
      type: body.type || 'text',
      linkUrl: body.linkUrl || undefined,
      fileName: body.fileName || undefined,
      fileType: body.fileType || undefined,
      priority: body.priority || 'medium',
      targetAudience: body.targetAudience || 'all',
      targetDepartments: sanitizedTargetDepartments.length > 0 ? sanitizedTargetDepartments : undefined,
      targetRoles: sanitizedTargetRoles.length > 0 ? sanitizedTargetRoles : undefined,
      tags: sanitizedTags.length > 0 ? sanitizedTags : undefined,
      isPublished: Boolean(body.isPublished),
      expiresAt: body.expiresAt || undefined,
      
      // Add user information to the request body for backend processing
      createdBy: user.id,
      createdByName: user.name,
      createdByRole: user.jobTitle || user.role, // Use job title for display
      createdByEmail: user.email,
      createdByDepartment: user.department,
      // Add access level information
      createdByAccessLevel: user.accessLevel,
      // Add timestamp
      createdAt: new Date().toISOString(),
    };

    // Forward request to backend with JWT token and user context
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // CRITICAL: JWT token for backend authentication
        'x-user-id': user.id,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': roleForBackend,
        'x-user-role-name': user.role,
        'x-user-name': user.name,
        'x-user-access-level': user.accessLevel,
      },
      body: JSON.stringify(enhancedBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Backend request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Notice Board API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}