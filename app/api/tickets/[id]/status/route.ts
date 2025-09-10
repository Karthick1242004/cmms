import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB, { connectToDatabase } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status values (updated to match our lowercase schema)
    const validStatuses = ['open', 'in-progress', 'pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: `Invalid status value. Valid statuses are: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find the ticket
    console.log('Looking for ticket with ID:', id);
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      console.log('Ticket not found with ID:', id);
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }
    console.log('Found ticket:', ticket.title, 'Status:', ticket.status);

    // Check if user has permission to update this ticket
    if (user && user.accessLevel !== 'super_admin') {
      const hasAccess = 
        ticket.department === user.department ||
        ticket.assignedDepartments?.includes(user.department) ||
        ticket.assignedUsers?.includes(user.name);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: 'Access denied - You do not have permission to update this ticket' },
          { status: 403 }
        );
      }
    }

    // Status verification workflow:
    // - Normal users: create a pending approval request
    // - Department heads/super_admin: apply immediately or approve pending
    const previousStatus = ticket.status
    const requestedStatus = body.status.toLowerCase()

    const isDepartmentHead = user?.accessLevel === 'super_admin' || user?.role === 'manager' || user?.accessLevel === 'department_admin'

    if (!isDepartmentHead) {
      // Normal user: mark as pending verification
      ticket.statusApproval = {
        pending: true,
        requestedStatus,
        requestedBy: user?.name || 'User',
        requestedAt: new Date(),
        verifiedBy: undefined,
        verifiedAt: undefined,
      }
    } else {
      // Department head/admin: if there is a pending request, finalize it
      if (ticket.statusApproval?.pending && ticket.statusApproval.requestedStatus) {
        ticket.status = ticket.statusApproval.requestedStatus
        ticket.statusApproval = {
          pending: false,
          requestedStatus: undefined,
          requestedBy: ticket.statusApproval.requestedBy,
          requestedAt: ticket.statusApproval.requestedAt,
          verifiedBy: user?.name || 'Approver',
          verifiedAt: new Date(),
        }
      } else {
        ticket.status = requestedStatus
        ticket.statusApproval = {
          pending: false,
          requestedStatus: undefined,
          requestedBy: undefined,
          requestedAt: undefined,
          verifiedBy: user?.name || 'Approver',
          verifiedAt: new Date(),
        }
      }
    }

    // Ensure legacy required fields are populated to satisfy schema validation
    if (!ticket.ticketId) {
      const legacySuffix = (ticket._id as any).toString().slice(-6).toUpperCase();
      const year = new Date().getFullYear();
      ticket.ticketId = `TKT-${year}-LEGACY-${legacySuffix}`;
    }
    ticket.loggedBy = ticket.loggedBy || ticket.createdBy || (user?.name ?? 'System');
    ticket.company = ticket.company || 'Default Company';
    ticket.area = ticket.area || 'Unknown Area';
    ticket.inCharge = ticket.inCharge || 'Unknown';
    ticket.reportedVia = ticket.reportedVia || 'Web Portal';

    // Ensure activityLog is initialized as an array (for legacy tickets)
    if (!ticket.activityLog || !Array.isArray(ticket.activityLog)) {
      console.log('Initializing activityLog for ticket:', id);
      ticket.activityLog = [];
    }

    // Add activity log entry
    if (body.remarks || previousStatus !== ticket.status || ticket.statusApproval?.pending) {
      console.log('Adding activity log entry for status change');
      ticket.activityLog.push({
        date: new Date(),
        loggedBy: user?.name || 'System',
        remarks: ticket.statusApproval?.pending
          ? (body.remarks || `Status change to ${requestedStatus} requested. Awaiting verification.`)
          : (body.remarks || `Status changed from ${previousStatus} to ${ticket.status}`),
        action: ticket.statusApproval?.pending ? 'Comment' : 'Status Change'
      });
    }

    // Save the ticket (validate only modified paths to avoid legacy required-field validation)
    console.log('Saving ticket with new status:', ticket.status);
    const updatedTicket = await ticket.save({ validateModifiedOnly: true });
    console.log('Ticket saved successfully');

    // Create asset activity log entry if ticket has an asset and status actually changed
    if (updatedTicket.equipmentId && (previousStatus !== updatedTicket.status || updatedTicket.statusApproval?.pending)) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        console.log('🚀 [Ticket Status] - Creating activity log for status change');
        
        // Fetch asset details for activity log
        let assetName = 'Unknown Asset';
        let assetTag = '';
        try {
          const { db } = await connectToDatabase();
          if (ObjectId.isValid(updatedTicket.equipmentId)) {
            const assetDoc = await db.collection('assets').findOne({ _id: new ObjectId(updatedTicket.equipmentId) });
            if (assetDoc) {
              assetName = assetDoc.assetName || assetDoc.name || 'Unknown Asset';
              assetTag = assetDoc.serialNo || assetDoc.assetTag || '';
            }
          }
        } catch (assetError) {
          console.error('Error fetching asset for activity log:', assetError);
        }
        
        // Determine activity log status and action based on ticket status
        const completionStates = ['completed', 'cancelled'];
        let action = 'updated';
        let title = 'Ticket Updated';
        let activityLogStatus = 'in_progress';
        let description = '';
        
        if (updatedTicket.statusApproval?.pending) {
          action = 'status_change_requested';
          title = 'Status Change Requested';
          description = `Status change to ${requestedStatus} requested for ticket: ${updatedTicket.title || updatedTicket.subject}`;
          activityLogStatus = 'pending';
        } else if (completionStates.includes(updatedTicket.status.toLowerCase())) {
          action = updatedTicket.status.toLowerCase() === 'completed' ? 'completed' : 'cancelled';
          title = updatedTicket.status.toLowerCase() === 'completed' ? 'Ticket Completed' : 'Ticket Cancelled';
          description = `Ticket ${action}: ${updatedTicket.title || updatedTicket.subject}`;
          activityLogStatus = 'completed';
        } else {
          action = 'status_updated';
          title = 'Ticket Status Updated';
          description = `Ticket status changed from ${previousStatus} to ${updatedTicket.status}: ${updatedTicket.title || updatedTicket.subject}`;
          activityLogStatus = updatedTicket.status.toLowerCase() === 'in-progress' ? 'in_progress' : 'pending';
        }
        
        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: updatedTicket.equipmentId,
            assetName: assetName,
            assetTag: assetTag,
            module: 'ticket',
            action: action,
            title: title,
            description: description,
            assignedTo: user?.id || '',
            assignedToName: user?.name || 'Unknown User',
            priority: updatedTicket.priority.toLowerCase() as any,
            status: activityLogStatus,
            recordId: updatedTicket._id.toString(),
            recordType: 'ticket_status_update',
            metadata: {
              ticketId: updatedTicket.ticketId,
              previousStatus: previousStatus,
              newStatus: updatedTicket.status,
              department: updatedTicket.department,
              area: updatedTicket.area,
              remarks: body.remarks || null,
              isPending: updatedTicket.statusApproval?.pending || false,
              requestedBy: updatedTicket.statusApproval?.requestedBy || null,
              verifiedBy: updatedTicket.statusApproval?.verifiedBy || null
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Ticket Status] - Activity log created for status change');
        } else {
          console.error('❌ [Ticket Status] - Activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('❌ [Ticket Status] - Failed to create activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    // Transform the response to match frontend expectations
    const transformedTicket = {
      ...updatedTicket.toJSON(),
      id: updatedTicket._id.toString(),
      subject: updatedTicket.title,
      _id: undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedTicket,
      message: 'Ticket status updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating ticket status' },
      { status: 500 }
    );
  }
} 