import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { calculateAssetAnalytics, getDateRangeForPreset } from '@/lib/asset-analytics-utils';
import type { AssetAnalyticsFilters, AnalyticsPreset } from '@/types/asset-analytics';
import type { DailyLogActivity } from '@/types/daily-log-activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user context for authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const assetId = resolvedParams.id;

    if (!assetId) {
      return NextResponse.json(
        { success: false, message: 'Asset ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const preset = searchParams.get('preset') as AnalyticsPreset;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'quarter' | 'year';

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (preset && preset !== 'custom') {
      const range = getDateRangeForPreset(preset);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Default to last 30 days
      const range = getDateRangeForPreset('last_30_days');
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date range provided' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // First, fetch asset details to get asset name and department
    const assetsCollection = db.collection('assets');
    const asset = await assetsCollection.findOne({ 
      _id: new ObjectId(assetId) 
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this asset's department (for non-super-admin users)
    if (user.accessLevel !== 'super_admin' && user.department !== asset.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - You can only view analytics for assets in your department' },
        { status: 403 }
      );
    }

    // Fetch daily log activities for the asset within the date range
    const activitiesCollection = db.collection('dailylogactivities');
    
    const query = {
      assetId: assetId,
      date: {
        $gte: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        $lte: endDate.toISOString().split('T')[0]
      },
      // Only include activities that have downtime data or can calculate it
      $or: [
        { downtime: { $exists: true, $gt: 0 } },
        { 
          $and: [
            { startTime: { $exists: true, $ne: null, $ne: '' } },
            { endTime: { $exists: true, $ne: null, $ne: '' } }
          ]
        }
      ]
    };

    console.log('🚀 [Asset Analytics] - Fetching activities with query:', JSON.stringify(query, null, 2));

    const activities = await activitiesCollection
      .find(query)
      .sort({ date: 1, startTime: 1 }) // Sort by date and start time
      .toArray();

    console.log(`📊 [Asset Analytics] - Found ${activities.length} activities for asset ${assetId}`);

    // Convert MongoDB documents to TypeScript objects
    const typedActivities: DailyLogActivity[] = activities.map(activity => ({
      _id: activity._id.toString(),
      date: activity.date,
      time: activity.time,
      startTime: activity.startTime,
      endTime: activity.endTime,
      downtime: activity.downtime,
      downtimeType: activity.downtimeType,
      area: activity.area,
      departmentId: activity.departmentId,
      departmentName: activity.departmentName,
      assetId: activity.assetId,
      assetName: activity.assetName,
      natureOfProblem: activity.natureOfProblem,
      commentsOrSolution: activity.commentsOrSolution,
      assignedTo: activity.assignedTo,
      assignedToName: activity.assignedToName,
      attendedBy: activity.attendedBy,
      attendedByName: activity.attendedByName,
      attendedByDetails: activity.attendedByDetails,
      adminVerified: activity.adminVerified || false,
      adminVerifiedBy: activity.adminVerifiedBy,
      adminVerifiedByName: activity.adminVerifiedByName,
      adminVerifiedAt: activity.adminVerifiedAt,
      adminNotes: activity.adminNotes,
      verifiedBy: activity.verifiedBy,
      verifiedByName: activity.verifiedByName,
      status: activity.status || 'open',
      priority: activity.priority || 'medium',
      createdBy: activity.createdBy,
      createdByName: activity.createdByName,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      images: activity.images || [],
      activityHistory: activity.activityHistory || []
    }));

    // Calculate analytics
    const analytics = calculateAssetAnalytics(
      assetId,
      asset.assetName || asset.name,
      asset.department,
      typedActivities,
      startDate,
      endDate
    );

    console.log(`✅ [Asset Analytics] - Calculated analytics for ${analytics.analysisPeriod.totalDays} days`);
    console.log(`📈 [Asset Analytics] - Overall availability: ${analytics.summary.overallAvailability}%`);

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Asset analytics calculated successfully'
    });

  } catch (error) {
    console.error('❌ [Asset Analytics] - Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while calculating asset analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
