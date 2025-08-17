import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing performance API call...');
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // Test performance API creation
    const testData = {
      employeeId: 'test-employee-123',
      employeeName: 'Test Employee',
      employeeEmail: 'test@example.com',
      department: 'Test Department',
      role: 'Test Role',
      workHistory: [{
        type: 'maintenance',
        title: 'Test Maintenance Task',
        description: 'Test description',
        assetName: 'Test Asset',
        status: 'pending',
        date: new Date().toISOString(),
        scheduleId: 'test-schedule-123',
        assignmentRole: 'Test Technician'
      }],
      assetAssignments: [{
        assetName: 'Test Asset',
        assetId: 'test-asset-123',
        assignedDate: new Date().toISOString(),
        status: 'active',
        role: 'primary',
        notes: 'Test assignment'
      }],
      currentAssignments: ['test-asset-123']
    };
    
    console.log('Calling performance API with test data:', testData);
    
    const performanceResponse = await fetch(`${baseUrl}/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('Performance API response status:', performanceResponse.status);
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        message: 'Performance API test failed',
        error: errorData,
        status: performanceResponse.status
      }, { status: 500 });
    }
    
    const responseData = await performanceResponse.json();
    console.log('Performance API response data:', responseData);
    
    return NextResponse.json({
      success: true,
      message: 'Performance API test successful',
      data: responseData
    });
    
  } catch (error) {
    console.error('Error testing performance API:', error);
    return NextResponse.json({
      success: false,
      message: 'Performance API test error',
      error: error.message
    }, { status: 500 });
  }
}
