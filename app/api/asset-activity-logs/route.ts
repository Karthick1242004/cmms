import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserContext } from '@/lib/auth-helpers';
import { ObjectId } from 'mongodb';
import type { 
  AssetActivityLogEntry, 
  AssetActivityLogFilters, 
  CreateAssetActivityLogParams,
  AssetActivityLogListResponse 
} from '@/types/asset-activity-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const module = searchParams.get('module');
    const activityType = searchParams.get('activityType');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const createdBy = searchParams.get('createdBy');
    const assignedTo = searchParams.get('assignedTo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('search');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const { db } = await connectToDatabase();

    // Build filter query
    const filter: any = {};

    // Asset filter (required)
    if (assetId) {
      filter.assetId = assetId;
    }

    // Access control - users can only see logs for assets in their department (unless super admin)
    if (user.accessLevel !== 'super_admin') {
      if (user.accessLevel === 'department_admin') {
        filter.department = user.department;
      } else {
        // Normal users can only see logs they're involved in
        filter.$or = [
          { createdBy: user.id },
          { assignedTo: user.id },
          { verifiedBy: user.id }
        ];
      }
    }

    // Department filter
    if (department && department !== 'all') {
      filter.department = department;
    }

    // Module filter
    if (module && module !== 'all') {
      filter.module = module;
    }

    // Activity type filter
    if (activityType && activityType !== 'all') {
      filter.activityType = activityType;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // User filters
    if (createdBy && createdBy !== 'all') {
      filter.createdBy = createdBy;
    }

    if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { assetName: { $regex: searchTerm, $options: 'i' } },
        { createdByName: { $regex: searchTerm, $options: 'i' } },
        { assignedToName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Deletion filter
    if (!includeDeleted) {
      filter.isDeleted = { $ne: true };
    }

    // Count total documents
    const total = await db.collection('assetactivitylogs').countDocuments(filter);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortCriteria: any = {};
    sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch logs
    const logs = await db.collection('assetactivitylogs')
      .find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform logs
    const transformedLogs: AssetActivityLogEntry[] = logs.map(log => ({
      ...log,
      id: log._id.toString(),
    }));

    // Generate summary statistics
    const summaryPipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          byModule: {
            $push: "$module"
          },
          byStatus: {
            $push: "$status"
          },
          byPriority: {
            $push: "$priority"
          }
        }
      }
    ];

    const summaryResult = await db.collection('assetactivitylogs').aggregate(summaryPipeline).toArray();
    
    let summary = {
      totalActivities: 0,
      byModule: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    if (summaryResult.length > 0) {
      const result = summaryResult[0];
      summary.totalActivities = result.totalActivities;
      
      // Count by module
      result.byModule.forEach((module: string) => {
        summary.byModule[module] = (summary.byModule[module] || 0) + 1;
      });
      
      // Count by status
      result.byStatus.forEach((status: string) => {
        summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      });
      
      // Count by priority
      result.byPriority.forEach((priority: string) => {
        summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
      });
    }

    const response: AssetActivityLogListResponse = {
      success: true,
      data: {
        logs: transformedLogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary
      },
      message: 'Asset activity logs retrieved successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching asset activity logs:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching asset activity logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const body: CreateAssetActivityLogParams = await request.json();

    // Validate required fields
    if (!body.assetId || !body.assetName || !body.module || !body.activityType || !body.title || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    // Create activity log entry
    const logEntry: Omit<AssetActivityLogEntry, 'id'> = {
      assetId: body.assetId,
      assetName: body.assetName,
      module: body.module,
      activityType: body.activityType,
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      status: body.status || 'active',
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      assignedTo: body.assignedTo,
      assignedToName: body.assignedToName,
      verifiedBy: body.metadata?.customFields?.verifiedBy,
      verifiedByName: body.metadata?.customFields?.verifiedByName,
      referenceId: body.referenceId,
      referenceName: body.referenceName,
      referenceType: body.referenceType,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: body.status === 'completed' ? now.toISOString() : undefined,
      verifiedAt: body.status === 'verified' ? now.toISOString() : undefined,
      scheduledAt: body.scheduledAt,
      department: body.department,
      departmentId: body.departmentId,
      location: body.metadata?.customFields?.location,
      metadata: body.metadata || {},
      editHistory: [],
      isEdited: false,
      isDeleted: false
    };

    // Insert into database
    const result = await db.collection('assetactivitylogs').insertOne(logEntry);

    // Fetch the created log
    const createdLog = await db.collection('assetactivitylogs').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Asset activity log created successfully',
      data: {
        ...createdLog,
        id: createdLog?._id.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating asset activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating asset activity log' },
      { status: 500 }
    );
  }
}
