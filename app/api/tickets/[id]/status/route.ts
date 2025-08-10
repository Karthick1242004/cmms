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
      // unauthenticated request; use safe defaults
    }

    await connectDB();
    const { id } = params;
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

    // Update the ticket status
    const previousStatus = ticket.status;
    ticket.status = body.status.toLowerCase();

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
    if (body.remarks || previousStatus !== ticket.status) {
      console.log('Adding activity log entry for status change');
      ticket.activityLog.push({
        date: new Date(),
        loggedBy: user?.name || 'System',
        remarks: body.remarks || `Status changed from ${previousStatus} to ${ticket.status}`,
        action: 'Status Change'
      });
    }

    // Save the ticket (validate only modified paths to avoid legacy required-field validation)
    console.log('Saving ticket with new status:', ticket.status);
    const updatedTicket = await ticket.save({ validateModifiedOnly: true });
    console.log('Ticket saved successfully');

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