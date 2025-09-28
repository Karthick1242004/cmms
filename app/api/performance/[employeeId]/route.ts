import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PerformanceModel } from '@/models/Performance';
import { getUserContext } from '@/lib/auth-helpers';
import type { WorkHistoryEntry, AssetAssignment } from '@/types/employee';

// GET - Fetch performance record for specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { employeeId } = await params;
    
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
      case 'maintenance_completion':
        // Handle both work history and metrics update
        if (!body.workHistoryEntry || !body.workHistoryEntry.type || !body.workHistoryEntry.title) {
          return NextResponse.json({
            success: false,
            message: 'Maintenance completion must include work history entry with type and title'
          }, { status: 400 });
        }
        
        const completionEntry: WorkHistoryEntry = {
          type: body.workHistoryEntry.type,
          title: body.workHistoryEntry.title,
          description: body.workHistoryEntry.description,
          assetName: body.workHistoryEntry.assetName,
          assetId: body.workHistoryEntry.assetId,
          status: body.workHistoryEntry.status || 'completed',
          date: body.workHistoryEntry.date || new Date().toISOString().split('T')[0],
          duration: body.workHistoryEntry.duration || 1,
          scheduleId: body.workHistoryEntry.scheduleId,
          recordId: body.workHistoryEntry.recordId,
          assignmentRole: body.workHistoryEntry.assignmentRole || 'Technician'
        };
        
        updateOperation = {
          $push: { workHistory: completionEntry },
          $set: { updatedAt: new Date() }
        };
        
        // Update performance metrics
        if (body.metricsUpdate) {
          const currentMetrics = existingRecord.performanceMetrics;
          const metricsUpdate: any = {};
          
          if (body.metricsUpdate.totalTasksCompleted) {
            metricsUpdate['performanceMetrics.totalTasksCompleted'] = 
              currentMetrics.totalTasksCompleted + body.metricsUpdate.totalTasksCompleted;
          }
          
          if (body.metricsUpdate.maintenanceCompleted) {
            metricsUpdate['performanceMetrics.maintenanceCompleted'] = 
              currentMetrics.maintenanceCompleted + body.metricsUpdate.maintenanceCompleted;
          }
          
          if (body.metricsUpdate.totalWorkHours) {
            metricsUpdate['totalWorkHours'] = 
              existingRecord.totalWorkHours + body.metricsUpdate.totalWorkHours;
          }
          
          if (body.metricsUpdate.lastActivityDate) {
            metricsUpdate['performanceMetrics.lastActivityDate'] = body.metricsUpdate.lastActivityDate;
          }
          
          // Calculate efficiency and update scores
          const newTotalTasks = metricsUpdate['performanceMetrics.totalTasksCompleted'] || currentMetrics.totalTasksCompleted;
          const newCompletedTasks = newTotalTasks; // Assuming all tracked tasks are completed
          metricsUpdate['performanceMetrics.efficiency'] = newTotalTasks > 0 ? Math.round((newCompletedTasks / newTotalTasks) * 100) : 0;
          
          // Update productivity score (simple calculation based on tasks completed)
          metricsUpdate['productivityScore'] = Math.min(100, Math.round((newTotalTasks / 10) * 100));
          
          // Update reliability score (based on completion rate)
          metricsUpdate['reliabilityScore'] = metricsUpdate['performanceMetrics.efficiency'] || currentMetrics.efficiency;
          
          updateOperation.$set = { ...updateOperation.$set, ...metricsUpdate };
        }
        break;
        
      case 'update_work_history':
        if (!body.scheduleId || !body.workHistoryUpdate) {
          return NextResponse.json({
            success: false,
            message: 'Work history update requires scheduleId and workHistoryUpdate'
          }, { status: 400 });
        }
        
        // Find the existing work history entry by scheduleId
        const workHistoryIndex = existingRecord.workHistory.findIndex(
          (entry: any) => entry.scheduleId === body.scheduleId && entry.type === 'maintenance'
        );
        
        if (workHistoryIndex === -1) {
          console.warn(`Work history entry not found for schedule ${body.scheduleId}`);
          return NextResponse.json({
            success: false,
            message: `Work history entry not found for schedule ${body.scheduleId}`
          }, { status: 404 });
        }
        
        // Prepare the update operation for the specific array element
        const arrayUpdateFields: any = {};
        
        // Update specific fields in the work history entry
        if (body.workHistoryUpdate.status) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.status`] = body.workHistoryUpdate.status;
        }
        if (body.workHistoryUpdate.date) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.date`] = body.workHistoryUpdate.date;
        }
        if (body.workHistoryUpdate.duration) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.duration`] = body.workHistoryUpdate.duration;
        }
        if (body.workHistoryUpdate.recordId) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.recordId`] = body.workHistoryUpdate.recordId;
        }
        if (body.workHistoryUpdate.description) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.description`] = body.workHistoryUpdate.description;
        }
        if (body.workHistoryUpdate.completedDate) {
          arrayUpdateFields[`workHistory.${workHistoryIndex}.completedDate`] = body.workHistoryUpdate.completedDate;
        }
        
        updateOperation = {
          $set: {
            ...arrayUpdateFields,
            updatedAt: new Date()
          }
        };
        
        // Update performance metrics only if task is being completed (status was pending, now completed)
        const currentEntry = existingRecord.workHistory[workHistoryIndex];
        const wasCompleted = currentEntry.status === 'completed';
        const nowCompleted = body.workHistoryUpdate.status === 'completed';
        
        if (!wasCompleted && nowCompleted && body.metricsUpdate) {
          const currentMetrics = existingRecord.performanceMetrics;
          const metricsUpdate: any = {};
          
          if (body.metricsUpdate.totalTasksCompleted) {
            metricsUpdate['performanceMetrics.totalTasksCompleted'] = 
              currentMetrics.totalTasksCompleted + body.metricsUpdate.totalTasksCompleted;
          }
          
          if (body.metricsUpdate.maintenanceCompleted) {
            metricsUpdate['performanceMetrics.maintenanceCompleted'] = 
              currentMetrics.maintenanceCompleted + body.metricsUpdate.maintenanceCompleted;
          }
          
          if (body.metricsUpdate.totalWorkHours) {
            metricsUpdate['totalWorkHours'] = 
              existingRecord.totalWorkHours + body.metricsUpdate.totalWorkHours;
          }
          
          if (body.metricsUpdate.lastActivityDate) {
            metricsUpdate['performanceMetrics.lastActivityDate'] = body.metricsUpdate.lastActivityDate;
          }
          
          // Calculate efficiency and update scores
          const newTotalTasks = metricsUpdate['performanceMetrics.totalTasksCompleted'] || currentMetrics.totalTasksCompleted;
          const newCompletedTasks = newTotalTasks; // Assuming all tracked tasks are completed
          metricsUpdate['performanceMetrics.efficiency'] = newTotalTasks > 0 ? Math.round((newCompletedTasks / newTotalTasks) * 100) : 0;
          
          // Update productivity score (simple calculation based on tasks completed)
          metricsUpdate['productivityScore'] = Math.min(100, Math.round((newTotalTasks / 10) * 100));
          
          // Update reliability score (based on completion rate)
          metricsUpdate['reliabilityScore'] = metricsUpdate['performanceMetrics.efficiency'] || currentMetrics.efficiency;
          
          updateOperation.$set = { ...updateOperation.$set, ...metricsUpdate };
        }
        break;
        
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
