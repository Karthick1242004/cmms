import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sanitizeDataForDuplication, validateDuplicateName, checkNameExists, DAILY_LOG_ACTIVITY_DUPLICATION_CONFIG } from '@/lib/duplication-utils';

/**
 * POST /api/daily-log-activities/[id]/duplicate
 * Duplicates a daily log activity with a new problem description
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: originalActivityId } = await params;

    // Get user context for authentication and authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    const body = await request.json();
    const { newProblemDescription } = body;

    console.log('🔄 [Daily Log Activity Duplication] - Starting duplication for activity:', originalActivityId);
    console.log('🔄 [Daily Log Activity Duplication] - New problem description:', newProblemDescription);

    // Validate the new problem description
    const descriptionValidation = validateDuplicateName(newProblemDescription);
    if (!descriptionValidation.isValid) {
      return NextResponse.json(
        { success: false, message: descriptionValidation.error },
        { status: 400 }
      );
    }

    // Check if the new problem description already exists
    const descriptionExists = await checkNameExists(newProblemDescription, 'daily-log-activities');
    if (descriptionExists) {
      return NextResponse.json(
        { success: false, message: 'A daily log activity with this problem description already exists. Please choose a different description.' },
        { status: 409 }
      );
    }

    // Fetch the original activity data
    console.log('🔍 [Daily Log Activity Duplication] - Fetching original activity data');
    
    const filter: any = { _id: new ObjectId(originalActivityId) };

    // Department-based access control
    if (user.accessLevel !== 'super_admin') {
      filter.departmentName = user.department;
    }

    const originalActivity = await db.collection('dailylogactivities').findOne(filter);

    if (!originalActivity) {
      return NextResponse.json(
        { success: false, message: 'Original daily log activity not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ [Daily Log Activity Duplication] - Original activity data retrieved');

    // Check access permissions for the original activity
    const canAccess = user.accessLevel === 'super_admin' || 
                     (user.accessLevel === 'department_admin' && originalActivity.departmentName === user.department) ||
                     originalActivity.createdBy === user.id ||
                     (Array.isArray(originalActivity.attendedBy) ? originalActivity.attendedBy.includes(user.id) : originalActivity.attendedBy === user.id);

    if (!canAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You can only duplicate activities you have access to.' },
        { status: 403 }
      );
    }

    // Debug: Log original activity data structure
    console.log('🔍 [Daily Log Activity Duplication] - Original activity keys:', Object.keys(originalActivity).length, 'fields');
    console.log('🔍 [Daily Log Activity Duplication] - Key fields present:', {
      area: !!originalActivity.area,
      assetId: !!originalActivity.assetId,
      natureOfProblem: !!originalActivity.natureOfProblem,
      attendedBy: !!originalActivity.attendedBy,
      startTime: !!originalActivity.startTime || !!originalActivity.time
    });

    // Sanitize and prepare data for duplication
    const sanitizedData: any = sanitizeDataForDuplication(
      originalActivity, 
      DAILY_LOG_ACTIVITY_DUPLICATION_CONFIG
    );

    console.log('🔍 [Daily Log Activity Duplication] - Sanitized data keys:', Object.keys(sanitizedData).length, 'fields');
    console.log('🔍 [Daily Log Activity Duplication] - Key fields after sanitization:', {
      area: !!sanitizedData.area,
      assetId: !!sanitizedData.assetId,
      natureOfProblem: !!sanitizedData.natureOfProblem,
      attendedBy: !!sanitizedData.attendedBy,
      startTime: !!sanitizedData.startTime || !!sanitizedData.time
    });

    // Set the new problem description
    sanitizedData[DAILY_LOG_ACTIVITY_DUPLICATION_CONFIG.nameField] = newProblemDescription.trim();

    // Set current user as creator and for department
    sanitizedData.createdBy = user.id;
    sanitizedData.createdByName = user.name;

    // For non-super-admin users, enforce department restrictions
    if (user.accessLevel !== 'super_admin') {
      sanitizedData.departmentName = user.department;
      // Find department ID from departments collection
      const department = await db.collection('departments').findOne({ name: user.department });
      if (department) {
        sanitizedData.departmentId = department._id.toString();
      }
    }

    // Ensure attendedBy and attendedByName are always arrays
    if (sanitizedData.attendedBy && !Array.isArray(sanitizedData.attendedBy)) {
      sanitizedData.attendedBy = [sanitizedData.attendedBy];
    }
    if (sanitizedData.attendedByName && !Array.isArray(sanitizedData.attendedByName)) {
      sanitizedData.attendedByName = [sanitizedData.attendedByName];
    }

    // Ensure required fields have fallback values if missing from sanitized data
    if (!sanitizedData.attendedBy || !Array.isArray(sanitizedData.attendedBy) || sanitizedData.attendedBy.length === 0) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing attendedBy, using original activity attendedBy');
      sanitizedData.attendedBy = Array.isArray(originalActivity.attendedBy) ? originalActivity.attendedBy : [originalActivity.attendedBy];
    }
    
    if (!sanitizedData.attendedByName || !Array.isArray(sanitizedData.attendedByName) || sanitizedData.attendedByName.length === 0) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing attendedByName, using original activity attendedByName');
      sanitizedData.attendedByName = Array.isArray(originalActivity.attendedByName) ? originalActivity.attendedByName : [originalActivity.attendedByName];
    }

    // Ensure other critical fields exist
    if (!sanitizedData.area) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing area, using original activity area');
      sanitizedData.area = originalActivity.area;
    }
    
    if (!sanitizedData.assetId) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing assetId, using original activity assetId');
      sanitizedData.assetId = originalActivity.assetId;
    }
    
    if (!sanitizedData.assetName) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing assetName, using original activity assetName');
      sanitizedData.assetName = originalActivity.assetName;
    }
    
    if (!sanitizedData.commentsOrSolution) {
      console.warn('⚠️  [Daily Log Activity Duplication] - Missing commentsOrSolution, using original activity commentsOrSolution');
      sanitizedData.commentsOrSolution = originalActivity.commentsOrSolution;
    }

    // Add duplication metadata
    const duplicatedActivityData: any = {
      ...sanitizedData,
      // Add metadata to track duplication
      duplicatedFrom: originalActivityId,
      duplicatedAt: new Date().toISOString(),
      duplicatedBy: user.id,
      // Ensure these fields are properly set
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'open',
      adminVerified: false
    };

    console.log('🔄 [Daily Log Activity Duplication] - Prepared sanitized data for creation');
    console.log('🔄 [Daily Log Activity Duplication] - Problem description:', duplicatedActivityData.natureOfProblem);
    console.log('🔄 [Daily Log Activity Duplication] - Department:', duplicatedActivityData.departmentName);

    // Debug: Log final duplicated activity data summary
    console.log('🔍 [Daily Log Activity Duplication] - Final data has', Object.keys(duplicatedActivityData).length, 'fields');
    console.log('🔍 [Daily Log Activity Duplication] - Critical fields ready:', {
      area: !!duplicatedActivityData.area,
      assetId: !!duplicatedActivityData.assetId,
      natureOfProblem: !!duplicatedActivityData.natureOfProblem,
      attendedBy: !!duplicatedActivityData.attendedBy,
      startTime: !!duplicatedActivityData.startTime || !!duplicatedActivityData.time
    });

    // Validate required fields
    const startTime = duplicatedActivityData.startTime || duplicatedActivityData.time;
    const attendedBy = Array.isArray(duplicatedActivityData.attendedBy) ? duplicatedActivityData.attendedBy : [duplicatedActivityData.attendedBy];
    
    // Validate required fields for activity creation
    const requiredFields = {
      startTime: !!startTime,
      area: !!duplicatedActivityData.area && duplicatedActivityData.area !== null && duplicatedActivityData.area !== undefined,
      departmentId: !!duplicatedActivityData.departmentId && duplicatedActivityData.departmentId !== null && duplicatedActivityData.departmentId !== undefined,
      assetId: !!duplicatedActivityData.assetId && duplicatedActivityData.assetId !== null && duplicatedActivityData.assetId !== undefined,
      natureOfProblem: !!duplicatedActivityData.natureOfProblem && duplicatedActivityData.natureOfProblem !== null && duplicatedActivityData.natureOfProblem !== undefined,
      commentsOrSolution: !!duplicatedActivityData.commentsOrSolution && duplicatedActivityData.commentsOrSolution !== null && duplicatedActivityData.commentsOrSolution !== undefined,
      attendedBy: attendedBy.length > 0 && attendedBy[0] !== '' && attendedBy[0] !== null && attendedBy[0] !== undefined
    };
    
    console.log('🔍 [Daily Log Activity Duplication] - Validation result:', requiredFields);
    
    if (!startTime || !duplicatedActivityData.area || !duplicatedActivityData.departmentId || 
        !duplicatedActivityData.assetId || !duplicatedActivityData.natureOfProblem || 
        !duplicatedActivityData.commentsOrSolution || attendedBy.length === 0 || attendedBy[0] === '') {
      
      const missingFields = [];
      if (!startTime) missingFields.push('startTime');
      if (!duplicatedActivityData.area) missingFields.push('area');
      if (!duplicatedActivityData.departmentId) missingFields.push('departmentId');
      if (!duplicatedActivityData.assetId) missingFields.push('assetId');
      if (!duplicatedActivityData.natureOfProblem) missingFields.push('natureOfProblem');
      if (!duplicatedActivityData.commentsOrSolution) missingFields.push('commentsOrSolution');
      if (attendedBy.length === 0 || attendedBy[0] === '') missingFields.push('attendedBy');
      
      console.error('❌ [Daily Log Activity Duplication] - Missing required fields:', missingFields);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Required fields are missing from duplicated activity data: ${missingFields.join(', ')}`,
          missingFields,
          receivedData: {
            startTime,
            area: duplicatedActivityData.area,
            departmentId: duplicatedActivityData.departmentId,
            assetId: duplicatedActivityData.assetId,
            natureOfProblem: duplicatedActivityData.natureOfProblem,
            commentsOrSolution: duplicatedActivityData.commentsOrSolution,
            attendedBy
          }
        },
        { status: 400 }
      );
    }

    // Create the new activity in MongoDB
    const result = await db.collection('dailylogactivities').insertOne(duplicatedActivityData);
    
    if (!result.insertedId) {
      console.error('❌ [Daily Log Activity Duplication] - Failed to create duplicated activity');
      return NextResponse.json(
        { success: false, message: 'Failed to create duplicated daily log activity' },
        { status: 500 }
      );
    }

    // Fetch the created activity to return with proper formatting
    const createdActivity = await db.collection('dailylogactivities').findOne({ _id: result.insertedId });
    
    if (!createdActivity) {
      console.error('❌ [Daily Log Activity Duplication] - Failed to retrieve created activity');
      return NextResponse.json(
        { success: false, message: 'Activity created but failed to retrieve' },
        { status: 500 }
      );
    }

    console.log('✅ [Daily Log Activity Duplication] - Activity duplicated successfully');
    console.log('✅ [Daily Log Activity Duplication] - New activity ID:', createdActivity._id);

    // Create asset activity log entry for the duplicated activity
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
          assetId: duplicatedActivityData.assetId,
          assetName: duplicatedActivityData.assetName,
          assetTag: duplicatedActivityData.assetTag,
          module: 'daily_log_activity',
          action: 'duplicated',
          title: 'Daily Activity Duplicated',
          description: `Daily activity duplicated: ${duplicatedActivityData.natureOfProblem}`,
          assignedTo: duplicatedActivityData.assignedTo || duplicatedActivityData.attendedBy,
          assignedToName: duplicatedActivityData.assignedToName || duplicatedActivityData.attendedByName,
          priority: (duplicatedActivityData.priority || 'medium').toLowerCase() as any,
          status: 'pending',
          recordId: createdActivity._id.toString(),
          recordType: 'daily_activity',
          metadata: {
            area: duplicatedActivityData.area,
            time: duplicatedActivityData.time,
            startTime: duplicatedActivityData.startTime,
            endTime: duplicatedActivityData.endTime,
            downtime: duplicatedActivityData.downtime,
            downtimeType: duplicatedActivityData.downtimeType,
            natureOfProblem: duplicatedActivityData.natureOfProblem,
            commentsOrSolution: duplicatedActivityData.commentsOrSolution,
            notes: duplicatedActivityData.commentsOrSolution,
            attendedBy: duplicatedActivityData.attendedByName,
            duplicatedFrom: originalActivityId
          }
        })
      });
      
      if (activityLogResponse.ok) {
        console.log('✅ [Daily Log Activity Duplication] - Activity log created');
      } else {
        console.error('❌ [Daily Log Activity Duplication] - Activity log creation failed:', await activityLogResponse.text());
      }
    } catch (logError) {
      console.error('❌ [Daily Log Activity Duplication] - Failed to create activity log:', logError);
      // Don't fail the duplication if logging fails
    }

    // Return success response with the new activity data
    return NextResponse.json(
      {
        success: true,
        message: 'Daily log activity duplicated successfully',
        data: {
          originalActivityId,
          newActivity: {
            ...createdActivity,
            id: createdActivity._id.toString()
          },
          duplicatedFields: Object.keys(sanitizedData),
          excludedFields: DAILY_LOG_ACTIVITY_DUPLICATION_CONFIG.excludeFields
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ [Daily Log Activity Duplication] - Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during daily log activity duplication',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
