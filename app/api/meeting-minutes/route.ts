import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const sortBy = searchParams.get('sortBy') || 'meetingDateTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filters
    const filters: any = {};

    // Department-based access control
    if (user.accessLevel !== 'super_admin') {
      filters.department = user.department;
    } else if (department && department !== 'all') {
      filters.department = department;
    }

    // Status filter
    if (status && status !== 'all') {
      filters.status = status;
    }

    // Search filter
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filters.$or = [
        { title: searchRegex },
        { purpose: searchRegex },
        { minutes: searchRegex },
        { createdByName: searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortCriteria: any = {};
    sortCriteria[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [meetingMinutes, totalCount] = await Promise.all([
      db.collection('meetingminutes')
        .find(filters)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('meetingminutes').countDocuments(filters)
    ]);

    // Transform data and add permission flags
    const transformedData = meetingMinutes.map((mom: any) => ({
      id: mom._id.toString(),
      title: mom.title,
      department: mom.department,
      meetingDateTime: mom.meetingDateTime,
      purpose: mom.purpose,
      minutes: mom.minutes,
      createdBy: mom.createdBy,
      createdByName: mom.createdByName,
      attendees: mom.attendees || [],
      status: mom.status,
      tags: mom.tags || [],
      location: mom.location,
      duration: mom.duration,
      actionItems: mom.actionItems || [],
      attachments: mom.attachments || [],
      createdAt: mom.createdAt,
      updatedAt: mom.updatedAt,
      // Permission flags
      canEdit: user.accessLevel === 'super_admin' || 
              (user.accessLevel === 'department_admin' && mom.department === user.department) ||
              mom.createdBy === user.id,
      canDelete: user.accessLevel === 'super_admin' || 
                (user.accessLevel === 'department_admin' && mom.department === user.department) ||
                mom.createdBy === user.id,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        meetingMinutes: transformedData,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        }
      },
      message: 'Meeting minutes retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    const body = await request.json();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Validate required fields
    if (!body.title || !body.meetingDateTime || !body.purpose || !body.minutes) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // For non-super-admin users, enforce department restrictions
    if (user.accessLevel !== 'super_admin') {
      body.department = user.department;
    }

    // Validate that the department exists if specified
    if (body.department) {
      const department = await db.collection('departments').findOne({ name: body.department });
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Invalid department specified' },
          { status: 400 }
        );
      }
    }

    // Prepare meeting minutes data
    const meetingMinutesData = {
      title: body.title,
      department: body.department || user.department,
      meetingDateTime: new Date(body.meetingDateTime),
      purpose: body.purpose,
      minutes: body.minutes,
      location: body.location || '',
      duration: body.duration || 60,
      attendees: body.attendees || [],
      actionItems: body.actionItems || [],
      tags: body.tags || [],
      attachments: body.attachments || [],
      status: body.status || 'draft',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into MongoDB
    const result = await db.collection('meetingminutes').insertOne(meetingMinutesData);

    // Fetch the created meeting minutes to return with proper formatting
    const createdMeetingMinutes = await db.collection('meetingminutes').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      message: 'Meeting minutes created successfully',
      data: {
        ...createdMeetingMinutes,
        id: createdMeetingMinutes?._id.toString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating meeting minutes' },
      { status: 500 }
    );
  }
}