import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';


export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const department = searchParams.get('department');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build the filter query
    const filter: any = {};

    // Access control based on user role and assignment
    if (user.accessLevel === 'super_admin') {
      // Super admin can see all activities, optionally filtered by department
      if (department && department !== 'all') {
        filter.departmentName = department;
      }
    } else if (user.accessLevel === 'department_admin') {
      // Department admin can see all activities in their department
      filter.departmentName = user.department;
    } else {
      // Normal users can only see activities assigned to them or in their department
      filter.$or = [
        { assignedTo: user.id }, // Activities assigned to them
        { attendedBy: user.id }, // Activities they are attending to
        { createdBy: user.id }, // Activities they created
        // Also include unassigned activities in their department for assignment purposes
        { 
          departmentName: user.department,
          $or: [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: '' }
          ]
        }
      ];
    }

    // Apply additional filters
    if (search) {
      // Combine access control filter with search filter
      const searchFilter = {
        $or: [
          { area: { $regex: search, $options: 'i' } },
          { assetName: { $regex: search, $options: 'i' } },
          { natureOfProblem: { $regex: search, $options: 'i' } },
          { commentsOrSolution: { $regex: search, $options: 'i' } },
          { attendedByName: { $regex: search, $options: 'i' } },
          { createdByName: { $regex: search, $options: 'i' } }
        ]
      };
      
      // If we already have access control $or, combine them with $and
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          searchFilter
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, searchFilter);
      }
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db.collection('dailylogactivities').countDocuments(filter);
    
    // Fetch activities with pagination and sorting
    const activities = await db.collection('dailylogactivities')
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform activities to include id field and ensure consistent format
    const transformedActivities = activities.map(activity => ({
      ...activity,
      id: activity._id.toString(),
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        activities: transformedActivities,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrev,
        }
      },
      message: 'Daily log activities retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching daily log activities:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching daily log activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment and audit trail
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    const body = await request.json();
    
    // Add created by information
    body.createdBy = user.id;
    body.createdByName = user.name;

    // For non-super-admin users, enforce department restrictions
    if (user.accessLevel !== 'super_admin') {
      // Lock department to user's department
      body.departmentName = user.department;
      // Find department ID from departments collection
      const department = await db.collection('departments').findOne({ name: user.department });
      if (department) {
        body.departmentId = department._id.toString();
      }
    }

    // Validate required fields
    if (!body.time || !body.area || !body.departmentId || !body.assetId || !body.natureOfProblem || !body.commentsOrSolution || !body.attendedBy) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();

    // Create initial activity history entry
    const initialHistoryEntry = {
      timestamp,
      action: 'created' as const,
      performedBy: user.id,
      performedByName: user.name,
      details: `Activity created by ${user.name}`,
      previousValue: null,
      newValue: body.status || 'open'
    };

    // If an employee is assigned, add assignment history
    const historyEntries = [initialHistoryEntry];
    if (body.assignedTo && body.assignedToName) {
      historyEntries.push({
        timestamp,
        action: 'assigned' as 'assigned',
        performedBy: user.id,
        performedByName: user.name,
        details: `Activity assigned to ${body.assignedToName}`,
        previousValue: null,
        newValue: body.assignedToName
      });
    }

    // Prepare activity document
    const activityData = {
      date: body.date ? new Date(body.date) : new Date(),
      time: body.time,
      area: body.area,
      departmentId: body.departmentId,
      departmentName: body.departmentName,
      assetId: body.assetId,
      assetName: body.assetName,
      natureOfProblem: body.natureOfProblem,
      commentsOrSolution: body.commentsOrSolution,
      // Assignment fields
      assignedTo: body.assignedTo || body.attendedBy, // Default to attendedBy if no specific assignment
      assignedToName: body.assignedToName || body.attendedByName,
      attendedBy: body.attendedBy,
      attendedByName: body.attendedByName,
      // Verification fields
      adminVerified: false,
      adminVerifiedBy: null,
      adminVerifiedByName: null,
      adminVerifiedAt: null,
      adminNotes: null,
      verifiedBy: body.verifiedBy || null, // Legacy field
      verifiedByName: body.verifiedByName || null, // Legacy field
      status: body.status || 'open',
      priority: body.priority || 'medium',
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      createdAt: now,
      updatedAt: now,
      // Activity history
      activityHistory: historyEntries,
    };

    // Insert into MongoDB
    const result = await db.collection('dailylogactivities').insertOne(activityData);

    // Fetch the created activity to return with proper formatting
    const createdActivity = await db.collection('dailylogactivities').findOne({ _id: result.insertedId });

    // Create asset activity log entry
    if (createdActivity) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: body.assetId,
            assetName: body.assetName,
            assetTag: body.assetTag,
            module: 'daily_log_activity',
            action: 'created',
            title: 'Daily Activity Created',
            description: `Daily activity created: ${body.natureOfProblem}`,
            assignedTo: body.assignedTo || body.attendedBy,
            assignedToName: body.assignedToName || body.attendedByName,
            priority: (body.priority || 'medium').toLowerCase() as any,
            status: 'pending',
            recordId: createdActivity._id.toString(),
            recordType: 'daily_activity',
            metadata: {
              area: body.area,
              time: body.time,
              notes: body.commentsOrSolution,
              attendedBy: body.attendedByName
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Daily Activity] - Activity log created');
        } else {
          console.error('❌ [Daily Activity] - Activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('Failed to create asset activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily log activity created successfully',
      data: {
        ...createdActivity,
        id: createdActivity?._id.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating daily log activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating daily log activity' },
      { status: 500 }
    );
  }
}