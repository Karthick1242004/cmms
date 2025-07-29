import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

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
    
    const backendUrl = `${BACKEND_URL}/api/meeting-minutes/stats`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Pass user context to backend
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
    console.error('Error fetching meeting minutes stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}