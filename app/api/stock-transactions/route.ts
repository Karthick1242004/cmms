import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue without department filter
    }

    const { searchParams } = new URL(request.url);
    
    // Per requirements: stock transactions can be seen by all users
    // Do not add automatic department filtering
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/stock-transactions${queryString ? `?${queryString}` : ''}`;

    // Prepare headers including user context for backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward user context to backend if user is authenticated
    if (user) {
      headers['x-user-id'] = user.id?.toString() || 'unknown';
      headers['x-user-name'] = user.name || 'Unknown User';
      headers['x-user-email'] = user.email || 'unknown@example.com';
      headers['x-user-department'] = user.department || 'Unknown';
      headers['x-user-role'] = user.role || 'technician';
    }

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch stock transactions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching stock transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Add transaction metadata
    const transactionData = {
      ...body,
      performedBy: user.name || user.email,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString().split('T')[1].split('.')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const url = `${SERVER_BASE_URL}/api/stock-transactions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id?.toString() || 'unknown',
        'x-user-name': user.name || 'Unknown User',
        'x-user-email': user.email || 'unknown@example.com',
        'x-user-department': user.department || 'Unknown',
        'x-user-role': user.role || 'technician',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create stock transaction' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating stock transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating stock transaction' },
      { status: 500 }
    );
  }
} 