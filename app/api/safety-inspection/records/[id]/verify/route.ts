import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { AssetActivityLogService } from '@/lib/asset-activity-log-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Only super admin and department admin can verify safety inspection records
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Only administrators can verify safety inspection records' },
        { status: 403 }
      );
    }

    const { adminNotes } = await request.json();

    const { db } = await connectToDatabase();
    
    // Find the safety inspection record
    const record = await db.collection('safetyinspectionrecords').findOne({ _id: new ObjectId(id) });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Safety inspection record not found' },
        { status: 404 }
      );
    }

    // Department admin can only verify records in their department
    if (user.accessLevel === 'department_admin' && record.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - You can only verify records in your department' },
        { status: 403 }
      );
    }

    // Update the record with verification information
    const updateData = {
      adminVerified: true,
      adminVerifiedBy: user.id,
      adminVerifiedByName: user.name,
      adminVerifiedAt: new Date().toISOString(),
      adminNotes: adminNotes || '',
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection('safetyinspectionrecords').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to verify safety inspection record' },
        { status: 500 }
      );
    }

    // Create asset activity log for verification
    try {
      await AssetActivityLogService.createSafetyInspectionLog({
        assetId: record.assetId,
        assetName: record.assetName,
        activityType: 'safety_inspection_verified',
        createdBy: user.id,
        createdByName: user.name,
        department: record.department,
        departmentId: '',
        context: {
          recordId: id,
          inspector: record.inspector,
          inspectorId: record.inspectorId,
          inspectionType: 'Safety Inspection Verification',
          complianceScore: record.overallComplianceScore,
          violations: record.violations?.length || 0,
          duration: record.actualDuration
        },
        additionalData: {
          verifiedBy: user.id,
          verifiedByName: user.name,
          metadata: {
            notes: `Admin verification: ${adminNotes || 'No additional notes'}`
          }
        },
        request
      });
    } catch (error) {
      console.error('Failed to create asset activity log for safety inspection verification:', error);
      // Don't fail the main operation if activity log creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Safety inspection record verified successfully',
      data: {
        ...result,
        id: result._id.toString(),
      }
    });

  } catch (error) {
    console.error('Error verifying safety inspection record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while verifying safety inspection record' },
      { status: 500 }
    );
  }
}