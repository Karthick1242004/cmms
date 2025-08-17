import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PerformanceModel } from '@/models/Performance';
import { getUserContext } from '@/lib/auth-helpers';
import type { WorkHistoryEntry, AssetAssignment } from '@/types/employee';

// GET - Fetch performance record for specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { employeeId } = params;
    
    // Find performance record
    const performanceRecord = await PerformanceModel.findOne({ 
      employeeId 
    }).lean();
    
    if (!performanceRecord) {
      return NextResponse.json({
        success: false,
        message: 'Performance record not found'
      }, { status: 404 });
    }
    
    // Check access permissions
    if (user && user.accessLevel !== 'super_admin' && performanceRecord.department !== user.department) {
      return NextResponse.json({
        success: false,
        message: 'Access denied to this performance record'
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: performanceRecord,
      message: 'Performance record retrieved successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching performance record:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch performance record'
    }, { status: 500 });
  }
}

// PUT - Update performance record for specific employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { employeeId } = params;
    const body = await request.json();
    
    // Find existing performance record
    const existingRecord = await PerformanceModel.findOne({ employeeId });
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        message: 'Performance record not found'
      }, { status: 404 });
    }
    
    // Check access permissions
    if (user && user.accessLevel !== 'super_admin' && existingRecord.department !== user.department) {
      return NextResponse.json({
        success: false,
        message: 'Access denied to update this performance record'
      }, { status: 403 });
    }
    
    // Update the record
    const updatedRecord = await PerformanceModel.findOneAndUpdate(
      { employeeId },
      {
        $set: {
          ...body,
          updatedAt: new Date()
        }
      },
      { new: true, lean: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Performance record updated successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating performance record:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update performance record'
    }, { status: 500 });
  }
}

// PATCH - Add work history entry or asset assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { employeeId } = params;
    const body = await request.json();
    const { action, data } = body;
    
    // Find existing performance record
    const existingRecord = await PerformanceModel.findOne({ employeeId });
    
    if (!existingRecord) {
      return NextResponse.json({
        success: false,
        message: 'Performance record not found'
      }, { status: 404 });
    }
    
    let updateOperation: any = {};
    
    switch (action) {
      case 'add_work_history':
        if (!data || !data.type || !data.title) {
          return NextResponse.json({
            success: false,
            message: 'Work history entry must have type and title'
          }, { status: 400 });
        }
        
        const workEntry: WorkHistoryEntry = {
          type: data.type,
          title: data.title,
          description: data.description,
          assetName: data.assetName,
          status: data.status || 'pending',
          date: data.date || new Date().toISOString(),
          duration: data.duration,
          scheduleId: data.scheduleId,
          recordId: data.recordId,
          assignmentRole: data.assignmentRole
        };
        
        updateOperation = {
          $push: { workHistory: workEntry },
          $set: { updatedAt: new Date() }
        };
        
        // Update performance metrics based on work type
        if (data.status === 'completed') {
          const metricsUpdate: any = {
            'performanceMetrics.totalTasksCompleted': existingRecord.performanceMetrics.totalTasksCompleted + 1,
            'performanceMetrics.lastActivityDate': new Date().toISOString()
          };
          
          switch (data.type) {
            case 'maintenance':
              metricsUpdate['performanceMetrics.maintenanceCompleted'] = 
                existingRecord.performanceMetrics.maintenanceCompleted + 1;
              break;
            case 'safety-inspection':
              metricsUpdate['performanceMetrics.safetyInspectionsCompleted'] = 
                existingRecord.performanceMetrics.safetyInspectionsCompleted + 1;
              break;
            case 'ticket':
              metricsUpdate['performanceMetrics.ticketsResolved'] = 
                existingRecord.performanceMetrics.ticketsResolved + 1;
              break;
            case 'daily-log':
              metricsUpdate['performanceMetrics.dailyLogEntries'] = 
                existingRecord.performanceMetrics.dailyLogEntries + 1;
              break;
          }
          
          updateOperation.$set = { ...updateOperation.$set, ...metricsUpdate };
        }
        break;
        
      case 'add_asset_assignment':
        if (!data || !data.assetName || !data.role) {
          return NextResponse.json({
            success: false,
            message: 'Asset assignment must have assetName and role'
          }, { status: 400 });
        }
        
        const assetAssignment: AssetAssignment = {
          assetName: data.assetName,
          assetId: data.assetId,
          assignedDate: data.assignedDate || new Date().toISOString(),
          status: data.status || 'active',
          role: data.role,
          notes: data.notes
        };
        
        updateOperation = {
          $push: { assetAssignments: assetAssignment },
          $set: { updatedAt: new Date() }
        };
        
        // Add to current assignments if active
        if (data.status === 'active' && data.assetId) {
          updateOperation.$addToSet = { currentAssignments: data.assetId };
        }
        break;
        
      case 'update_current_assignments':
        updateOperation = {
          $set: { 
            currentAssignments: data.currentAssignments || [],
            updatedAt: new Date()
          }
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action specified'
        }, { status: 400 });
    }
    
    // Apply the update
    const updatedRecord = await PerformanceModel.findOneAndUpdate(
      { employeeId },
      updateOperation,
      { new: true, lean: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: `Performance record updated successfully (${action})`
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating performance record:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update performance record'
    }, { status: 500 });
  }
}

// DELETE - Remove performance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { employeeId } = params;
    
    // Check if user has permission to delete (super admin only)
    if (!user || user.accessLevel !== 'super_admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied. Only super admin can delete performance records.'
      }, { status: 403 });
    }
    
    const deletedRecord = await PerformanceModel.findOneAndDelete({ employeeId });
    
    if (!deletedRecord) {
      return NextResponse.json({
        success: false,
        message: 'Performance record not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Performance record deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting performance record:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete performance record'
    }, { status: 500 });
  }
}
