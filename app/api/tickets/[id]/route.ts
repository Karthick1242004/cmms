import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue
    }

    await connectDB();
    const { id } = params;
    
    // Fetch ticket from local MongoDB
    const ticket = await Ticket.findById(id).lean();

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this ticket
    if (user && user.accessLevel !== 'super_admin' && !ticket.isOpenTicket) {
      const hasAccess = 
        ticket.department === user.department ||
        ticket.assignedDepartments?.includes(user.department) ||
        ticket.assignedUsers?.includes(user.name);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: 'Access denied - You do not have permission to view this ticket' },
          { status: 403 }
        );
      }
    }

    // Transform the ticket to match frontend expectations
    const transformedTicket = {
      ...ticket,
      id: (ticket._id as any).toString(),
      subject: ticket.title, // Map title to subject for frontend compatibility
      
      // Generate ticketId for legacy tickets that don't have one
      ticketId: ticket.ticketId || `TKT-LEGACY-1`,
      
      // Ensure reportType always exists with proper structure
      reportType: ticket.reportType || {
        service: ticket.category === 'service',
        maintenance: ticket.category === 'maintenance',
        incident: ticket.category === 'incident',
        breakdown: ticket.category === 'breakdown'
      },
      
      // Ensure date fields are properly formatted
      loggedDateTime: ticket.loggedDateTime || ticket.createdAt || new Date().toISOString(),
      
      // Map loggedBy field - use loggedBy if exists, otherwise fallback to createdBy
      loggedBy: ticket.loggedBy || ticket.createdBy || 'Unknown User',
      
      // Ensure other required fields have fallbacks
      assignedDepartments: ticket.assignedDepartments || [],
      assignedUsers: ticket.assignedUsers || [],
      activityLog: ticket.activityLog || [],
      
      // Ensure required string fields exist
      company: ticket.company || 'Unknown Company',
      area: ticket.area || 'Unknown Area',
      inCharge: ticket.inCharge || 'Unknown',
      reportedVia: ticket.reportedVia || 'Web Portal',
      
      _id: undefined // Remove _id to avoid confusion
    };

    return NextResponse.json({ 
      success: true, 
      data: transformedTicket 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Validate required fields - check both frontend and backend field names
    if ((!body.subject && !body.title) || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Subject/Title and description are required' },
        { status: 400 }
      );
    }

    // Validate that at least one report type is selected
    const hasReportType = body.reportType && (
      body.reportType.service || 
      body.reportType.maintenance || 
      body.reportType.incident || 
      body.reportType.breakdown
    );

    if (!hasReportType) {
      return NextResponse.json(
        { success: false, message: 'At least one report type must be selected' },
        { status: 400 }
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

    // Update ticket fields
    if (body.title || body.subject) ticket.title = body.title || body.subject;
    if (body.description) ticket.description = body.description;
    if (body.priority) ticket.priority = body.priority.toLowerCase();
    if (body.status) ticket.status = body.status.toLowerCase();
    if (body.department) ticket.department = body.department;
    if (body.area) ticket.area = body.area;
    if (body.inCharge) ticket.inCharge = body.inCharge;
    if (body.equipmentId !== undefined) ticket.equipmentId = body.equipmentId;
    if (body.solution !== undefined) ticket.solution = body.solution;
    if (body.reportType) ticket.reportType = body.reportType;
    if (body.isOpenTicket !== undefined) ticket.isOpenTicket = body.isOpenTicket;
    if (body.assignedDepartments) ticket.assignedDepartments = body.assignedDepartments;
    if (body.assignedUsers) ticket.assignedUsers = body.assignedUsers;

    // Ensure activityLog is initialized as an array (for legacy tickets)
    if (!ticket.activityLog || !Array.isArray(ticket.activityLog)) {
      ticket.activityLog = [];
    }

    // Add activity log entry for update
    ticket.activityLog.push({
      date: new Date(),
      loggedBy: user?.name || 'System',
      remarks: 'Ticket updated',
      action: 'Updated'
    });

    // Save the updated ticket
    const updatedTicket = await ticket.save();

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
      message: 'Ticket updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const { id } = params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/tickets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete ticket' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting ticket' },
      { status: 500 }
    );
  }
} 