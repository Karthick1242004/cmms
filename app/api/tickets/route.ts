import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB, { connectToDatabase } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { ObjectId } from 'mongodb';

// Helper function to fetch asset details
async function fetchAssetDetails(assetId: string) {
  try {
    const { db } = await connectToDatabase();
    console.log('Fetching asset with ID:', assetId);
    
    // Validate ObjectId format
    if (!ObjectId.isValid(assetId)) {
      console.error('Invalid ObjectId format:', assetId);
      return null;
    }
    
    const asset = await db.collection('assets').findOne({ _id: new ObjectId(assetId) });
    console.log('Asset found:', !!asset);
    
    if (asset) {
      const assetDetails = {
        id: asset._id.toString(),
        name: asset.assetName || asset.name || 'Unknown Asset',
        assetTag: asset.serialNo || asset.assetTag || '',
        type: asset.category || asset.type || '',
        location: asset.location || '',
        department: asset.department || '',
        status: asset.statusText || asset.status || 'Unknown'
      };
      console.log('Asset details:', assetDetails);
      return assetDetails;
    }
    return null;
  } catch (error) {
    console.error('Error fetching asset details:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue without department filter
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const department = searchParams.get('department');
    const reportType = searchParams.get('reportType');
    const isOpenTicket = searchParams.get('isOpenTicket') === 'true';
    const sortBy = searchParams.get('sortBy') || 'loggedDateTime';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build the filter query
    const filter: any = {};

    // Department filtering for non-admin users
    if (user && user.role !== 'admin' && !isOpenTicket) {
      filter.$or = [
        { department: user.department },
        { assignedDepartments: user.department },
        { isOpenTicket: true }
      ];
    }

    // Apply additional filters
    if (search) {
      filter.$or = [
        ...(filter.$or || []),
        { ticketId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { loggedBy: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (department && department !== 'all') {
      filter.$or = [
        { department: department },
        { assignedDepartments: department }
      ];
    }

    if (reportType && reportType !== 'all') {
      filter[`reportType.${reportType}`] = true;
    }

    if (isOpenTicket) {
      filter.isOpenTicket = true;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const [tickets, totalCount] = await Promise.all([
      Ticket.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    // Transform the tickets to match frontend expectations with asset details
    const transformedTickets = await Promise.all(
      tickets.map(async (ticket: any, index) => {
        // Fetch asset details if equipmentId exists
        let asset = null;
        if (ticket.equipmentId) {
          asset = await fetchAssetDetails(ticket.equipmentId);
        }

        return {
          ...ticket,
          id: (ticket._id as any).toString(),
          subject: ticket.title, // Map title back to subject for frontend compatibility
          
          // Generate ticketId for legacy tickets that don't have one
          ticketId: ticket.ticketId || `TKT-LEGACY-${index + 1}`,
          
          // Include asset details
          asset,
          
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
          
          // Ensure statusApproval is included in frontend data
          statusApproval: ticket.statusApproval || { pending: false },
          
          _id: undefined // Remove _id to avoid confusion
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        tickets: transformedTickets,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrevious
        }
      },
      message: 'Tickets retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    await connectDB();

    const body = await request.json();
    
    // Add user information to ticket data
    if (!body.loggedBy) {
      body.loggedBy = user?.name || 'Test User';
    }

    // Add department to data if not provided (use user's department unless admin specifies different)
    if (!body.department) {
      body.department = user?.department || 'General';
    }

    // Add company if not provided
    if (!body.company) {
      body.company = 'Default Company';
    }

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

    // Ensure required backend fields are present
    if (!body.createdBy) {
      body.createdBy = user?.name || 'Test User';
    }

    if (!body.category) {
      // Generate category from report type if not provided
      if (body.reportType.service) body.category = 'service';
      else if (body.reportType.maintenance) body.category = 'maintenance';
      else if (body.reportType.incident) body.category = 'incident';
      else if (body.reportType.breakdown) body.category = 'breakdown';
      else body.category = 'general';
    }

    // Ensure priority is lowercase
    if (body.priority) {
      body.priority = body.priority.toLowerCase();
    }

    // Create the ticket data object
    const ticketData = {
      title: body.title || body.subject, // Use title if provided, otherwise use subject
      description: body.description,
      priority: body.priority,
      status: body.status || 'open',
      category: body.category,
      loggedDateTime: body.loggedDateTime ? new Date(body.loggedDateTime) : new Date(),
      loggedBy: body.loggedBy,
      createdBy: body.createdBy,
      company: body.company,
      department: body.department,
      area: body.area,
      inCharge: body.inCharge,
      equipmentId: body.equipmentId,
      reportedVia: body.reportedVia,
      reportType: body.reportType,
      solution: body.solution,
      isOpenTicket: body.isOpenTicket || false,
      assignedDepartments: body.assignedDepartments || [],
      assignedUsers: body.assignedUsers || [],
      images: body.images || []
    };

    // Create the ticket
    const ticket = new Ticket(ticketData);
    const savedTicket = await ticket.save();

    // Create asset activity log entry if ticket has an asset
    if (savedTicket.equipmentId) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        console.log('🚀 [Ticket] - Creating activity log for ticket creation');
        
        // Fetch asset details for activity log
        let assetName = 'Unknown Asset';
        let assetTag = '';
        try {
          const { db } = await connectToDatabase();
          if (ObjectId.isValid(savedTicket.equipmentId)) {
            const assetDoc = await db.collection('assets').findOne({ _id: new ObjectId(savedTicket.equipmentId) });
            if (assetDoc) {
              assetName = assetDoc.assetName || assetDoc.name || 'Unknown Asset';
              assetTag = assetDoc.serialNo || assetDoc.assetTag || '';
            }
          }
        } catch (assetError) {
          console.error('Error fetching asset for activity log:', assetError);
        }
        
        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: savedTicket.equipmentId,
            assetName: assetName,
            assetTag: assetTag,
            module: 'ticket',
            action: 'created',
            title: 'Ticket Created',
            description: `Ticket created: ${savedTicket.title || savedTicket.subject}`,
            assignedTo: user?.id || '',
            assignedToName: user?.name || savedTicket.loggedBy || 'Unknown User',
            priority: savedTicket.priority.toLowerCase() as any,
            status: 'pending',
            recordId: savedTicket._id.toString(),
            recordType: 'ticket',
            metadata: {
              ticketId: savedTicket.ticketId,
              department: savedTicket.department,
              area: savedTicket.area,
              inCharge: savedTicket.inCharge,
              reportType: savedTicket.category || 'general',
              ticketStatus: savedTicket.status
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Ticket] - Activity log created for ticket creation');
        } else {
          console.error('❌ [Ticket] - Activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('❌ [Ticket] - Failed to create activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    // Transform the response to match frontend expectations
    const response = {
      ...savedTicket.toJSON(),
      subject: savedTicket.title // Add subject field for frontend compatibility
    };

    return NextResponse.json({
      success: true,
      data: {
        ticket: response,
        ticketId: savedTicket.ticketId
      },
      message: 'Ticket created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error) {
      // Check for duplicate key error (ticketId already exists)
      if (error.message.includes('E11000') && error.message.includes('ticketId')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Ticket ID conflict detected. Please try again.',
            error: 'DUPLICATE_TICKET_ID'
          },
          { status: 409 }
        );
      }
      
      // Check for validation errors
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation error: Please check your input data.',
            error: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while creating ticket. Please try again.',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 