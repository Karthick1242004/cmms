import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';

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

    // Build department filter based on user role
    const departmentFilter: any = {};
    if (user.accessLevel !== 'super_admin') {
      departmentFilter.department = user.department;
    }

    const [
      totalCount,
      publishedCount,
      draftCount,
      archivedCount,
      departmentBreakdown,
      recentMeetings,
    ] = await Promise.all([
      db.collection('meetingminutes').countDocuments(departmentFilter),
      db.collection('meetingminutes').countDocuments({ ...departmentFilter, status: 'published' }),
      db.collection('meetingminutes').countDocuments({ ...departmentFilter, status: 'draft' }),
      db.collection('meetingminutes').countDocuments({ ...departmentFilter, status: 'archived' }),
      db.collection('meetingminutes').aggregate([
        { $match: departmentFilter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      db.collection('meetingminutes')
        .find(departmentFilter)
        .sort({ meetingDateTime: -1 })
        .limit(5)
        .project({ title: 1, department: 1, meetingDateTime: 1, createdByName: 1 })
        .toArray(),
    ]);

    // Format statistics
    const stats = {
      totalMeetingMinutes: totalCount,
      publishedMeetingMinutes: publishedCount,
      draftMeetingMinutes: draftCount,
      archivedMeetingMinutes: archivedCount,
      departmentBreakdown,
      recentMeetings: recentMeetings.map(meeting => ({
        ...meeting,
        id: meeting._id.toString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching meeting minutes stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}