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

    // Department filtering based on access level
    if (user.accessLevel !== 'super_admin') {
      // Non-super-admin users can only see activities from their department
      filter.departmentName = user.department;
    } else if (department && department !== 'all') {
      // Super admin can filter by specific department
      filter.departmentName = department;
    }

    // Apply additional filters
    if (search) {
      filter.$or = [
        { area: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { natureOfProblem: { $regex: search, $options: 'i' } },
        { commentsOrSolution: { $regex: search, $options: 'i' } },
        { attendedByName: { $regex: search, $options: 'i' } },
        { createdByName: { $regex: search, $options: 'i' } }
      ];
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
      attendedBy: body.attendedBy,
      attendedByName: body.attendedByName,
      verifiedBy: body.verifiedBy || null,
      verifiedByName: body.verifiedByName || null,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into MongoDB
    const result = await db.collection('dailylogactivities').insertOne(activityData);

    // Fetch the created activity to return with proper formatting
    const createdActivity = await db.collection('dailylogactivities').findOne({ _id: result.insertedId });

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