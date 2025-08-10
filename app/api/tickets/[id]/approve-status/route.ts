import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = params;
    const body = await request.json();
    const { action, remarks } = body; // action: 'approve' | 'reject'

    // Check if user has permission to approve (department admin or super admin)
    const isDepartmentHead = user.accessLevel === 'super_admin' || 
                             user.role === 'manager' || 
                             user.accessLevel === 'department_admin';

    if (!isDepartmentHead) {
      return NextResponse.json(
        { success: false, message: 'Only department administrators can approve status changes' },
        { status: 403 }
      );
    }

    // Find the ticket
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if there's a pending status approval
    if (!ticket.statusApproval?.pending) {
      return NextResponse.json(
        { success: false, message: 'No pending status change to approve' },
        { status: 400 }
      );
    }

    // Check department access
    if (user.accessLevel !== 'super_admin' && ticket.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Ticket belongs to different department' },
        { status: 403 }
      );
    }

    const previousStatus = ticket.status;
    const requestedStatus = ticket.statusApproval.requestedStatus;

    // Ensure activityLog is initialized
    if (!ticket.activityLog || !Array.isArray(ticket.activityLog)) {
      ticket.activityLog = [];
    }

    if (action === 'approve') {
      // Approve the status change
      ticket.status = requestedStatus;
      ticket.statusApproval = {
        pending: false,
        requestedStatus: undefined,
        requestedBy: ticket.statusApproval.requestedBy,
        requestedAt: ticket.statusApproval.requestedAt,
        verifiedBy: user.name,
        verifiedAt: new Date(),
      };

      // Add activity log entry for approval
      ticket.activityLog.push({
        date: new Date(),
        loggedBy: user.name,
        remarks: remarks || `Status change approved: ${previousStatus} → ${requestedStatus}`,
        action: 'Status Change'
      });

    } else if (action === 'reject') {
      // Reject the status change
      ticket.statusApproval = {
        pending: false,
        requestedStatus: undefined,
        requestedBy: ticket.statusApproval.requestedBy,
        requestedAt: ticket.statusApproval.requestedAt,
        verifiedBy: user.name,
        verifiedAt: new Date(),
      };

      // Add activity log entry for rejection
      ticket.activityLog.push({
        date: new Date(),
        loggedBy: user.name,
        remarks: remarks || `Status change rejected: ${requestedStatus}`,
        action: 'Comment'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Save the ticket
    const updatedTicket = await ticket.save({ validateModifiedOnly: true });

    // Transform the response to match frontend expectations
    const transformedTicket = {
      ...updatedTicket.toJSON(),
      id: updatedTicket._id.toString(),
      subject: updatedTicket.title,
      statusApproval: updatedTicket.statusApproval,
      _id: undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedTicket,
      message: action === 'approve' 
        ? `Status change approved: ${previousStatus} → ${requestedStatus}`
        : 'Status change rejected'
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing status approval:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while processing approval' },
      { status: 500 }
    );
  }
}
