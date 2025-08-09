import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to get user context from headers/session
const getUserContext = async (request: NextRequest) => {
  // TODO: Replace with actual authentication logic
  // This is a mock implementation
  return {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Engineering',
    role: 'admin' as const, // or 'user'
  };
};

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    
    // Forward the request to the backend with user context
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const backendUrl = `${SERVER_BASE_URL}/api/meeting-minutes?${searchParams.toString()}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Pass user context to backend (you may need to adjust this based on your auth implementation)
        'x-user-id': userContext.id,
        'x-user-name': userContext.name,
        'x-user-email': userContext.email,
        'x-user-department': userContext.department,
        'x-user-role': userContext.role,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    const body = await request.json();
    
    const backendUrl = `${SERVER_BASE_URL}/api/meeting-minutes`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userContext.id,
        'x-user-name': userContext.name,
        'x-user-email': userContext.email,
        'x-user-department': userContext.department,
        'x-user-role': userContext.role,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}