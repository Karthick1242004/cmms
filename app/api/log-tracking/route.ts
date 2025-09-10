import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import LogTracking from '@/models/LogTracking';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication and filtering
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const module = searchParams.get('module');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filterQuery: any = {};

    // Module filter (required)
    if (module) {
      filterQuery.module = module;
    }

    // Entity filter
    if (entityId) {
      filterQuery.entityId = entityId;
    }

    // Action filter
    if (action) {
      filterQuery.action = action;
    }

    // User filter
    if (userId) {
      filterQuery.userId = userId;
    }

    // Department-based access control (except for super admins)
    if (user.accessLevel !== 'super_admin') {
      // Regular users can only see logs from their department
      filterQuery.userDepartment = user.department;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [logs, totalCount] = await Promise.all([
      LogTracking.find(filterQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      LogTracking.countDocuments(filterQuery)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log._id.toString(),
          module: log.module,
          entityId: log.entityId,
          entityName: log.entityName,
          action: log.action,
          actionDescription: log.actionDescription,
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          userDepartment: log.userDepartment,
          userAccessLevel: log.userAccessLevel,
          fieldsChanged: log.fieldsChanged || [],
          metadata: log.metadata || {},
          createdAt: log.createdAt,
          updatedAt: log.updatedAt
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext,
          hasPrevious
        }
      },
      message: 'Log entries retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching log tracking entries:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching log entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['module', 'entityId', 'entityName', 'action', 'actionDescription'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate enum values
    const validModules = ['parts', 'assets', 'tickets', 'employees', 'locations', 'departments', 'maintenance', 'safety-inspection', 'daily-log-activities', 'meeting-minutes', 'stock-transactions'];
    const validActions = ['create', 'update', 'delete', 'status_change', 'assign', 'unassign', 'approve', 'reject', 'complete', 'cancel'];

    if (!validModules.includes(body.module)) {
      return NextResponse.json(
        { success: false, message: `Invalid module. Must be one of: ${validModules.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { success: false, message: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get client IP and user agent for metadata
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Prepare log entry data
    const logData = {
      module: body.module,
      entityId: body.entityId,
      entityName: body.entityName,
      action: body.action,
      actionDescription: body.actionDescription,
      
      // User information from authenticated user
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartment: user.department,
      userAccessLevel: user.accessLevel,
      
      // Change details
      fieldsChanged: body.fieldsChanged || [],
      
      // Metadata
      metadata: {
        ipAddress: clientIP,
        userAgent: userAgent,
        sessionId: body.sessionId,
        reason: body.reason,
        relatedEntities: body.relatedEntities || [],
        ...body.metadata // Allow additional metadata
      }
    };

    // Create log entry
    const logEntry = new LogTracking(logData);
    const savedLog = await logEntry.save();

    return NextResponse.json({
      success: true,
      data: {
        id: savedLog._id.toString(),
        module: savedLog.module,
        entityId: savedLog.entityId,
        entityName: savedLog.entityName,
        action: savedLog.action,
        actionDescription: savedLog.actionDescription,
        userId: savedLog.userId,
        userName: savedLog.userName,
        userEmail: savedLog.userEmail,
        userDepartment: savedLog.userDepartment,
        userAccessLevel: savedLog.userAccessLevel,
        fieldsChanged: savedLog.fieldsChanged,
        metadata: savedLog.metadata,
        createdAt: savedLog.createdAt,
        updatedAt: savedLog.updatedAt
      },
      message: 'Log entry created successfully'
    });

  } catch (error) {
    console.error('Error creating log tracking entry:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating log entry' },
      { status: 500 }
    );
  }
}
