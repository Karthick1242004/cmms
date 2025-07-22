import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('No user authentication found, proceeding without department filtering for testing');
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.role !== 'admin') {
      // If not specifically requesting open tickets, add department filter
      if (!searchParams.get('isOpenTicket')) {
        searchParams.set('department', user.department);
      }
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/tickets${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server with user context headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch tickets' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('No user authentication found, proceeding with default values for testing');
    }

    const body = await request.json();
    
    // Add user information to ticket data
    if (!body.loggedBy) {
      body.loggedBy = user?.name || 'Test User';
    }

    // Add department to data if not provided (use user's department unless admin specifies different)
    if (!body.department) {
      body.department = user?.department || 'General';
    }

    // Add company if not provided
    if (!body.company) {
      body.company = user?.company || 'Default Company';
    }

    // Validate required fields
    if (!body.subject || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Validate that at least one report type is selected
    const hasReportType = body.reportType && (
      body.reportType.service || 
      body.reportType.maintenance || 
      body.reportType.incident || 
      body.reportType.breakdown
    );

    if (!hasReportType) {
      return NextResponse.json(
        { success: false, message: 'At least one report type must be selected' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create ticket' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating ticket' },
      { status: 500 }
    );
  }
} 