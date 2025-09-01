import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { activityLogApi } from '@/lib/activity-log-api'
import { sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'
import type { SafetyInspectionRecord } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let records = [...sampleSafetyInspectionRecords]

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/records/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch safety inspection record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching safety inspection record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching safety inspection record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update safety inspection record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Create activity log for update
    if (data.success && data.data && body.assetId) {
      try {
        console.log('🚀 [Safety Inspection] - Creating update activity log');
        
        await activityLogApi.create({
          assetId: body.assetId,
          assetName: body.assetName,
          assetTag: body.assetTag,
          module: 'safety_inspection',
          action: 'updated',
          title: 'Safety Inspection Updated',
          description: `Safety inspection record updated by ${user.name}`,
          assignedTo: body.inspectorId,
          assignedToName: body.inspector,
          priority: 'medium',
          status: body.status || 'in_progress',
          recordId: id,
          recordType: 'inspection_record',
          metadata: {
            complianceScore: body.overallComplianceScore,
            violations: body.violations?.length || 0,
            duration: body.actualDuration,
            notes: body.inspectorNotes
          }
        });
        
        console.log('✅ [Safety Inspection] - Update activity log created');
      } catch (error) {
        console.error('❌ [Safety Inspection] - Failed to create update activity log:', error);
      }
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error updating safety inspection record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating safety inspection record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/records/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete safety inspection record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting safety inspection record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting safety inspection record' },
      { status: 500 }
    );
  }
} 