import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import MaintenanceChecklistData from '@/models/MaintenanceChecklistData'
import { connectToDatabase } from '@/lib/mongodb'

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { scheduleId } = params
    const { searchParams } = new URL(request.url)

    // Get user context for authentication
    const user = await getUserContext(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    // Build query parameters for backend
    const queryParams = new URLSearchParams()
    queryParams.append('scheduleId', scheduleId)
    
    // Forward any additional query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'scheduleId') { // scheduleId is already handled
        queryParams.append(key, value)
      }
    })

    // Add department filter for non-super-admin users
    if (user.accessLevel !== 'super_admin') {
      queryParams.append('department', user.department)
    }

    const url = `${SERVER_BASE_URL}/api/maintenance/records?${queryParams.toString()}`

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user.department || 'General',
        'X-User-Name': user.name || 'Unknown User',
        'X-User-Role': user.role || 'user',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to fetch maintenance records for schedule' 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Ensure department field is populated and filter by scheduleId
    if (data.success && data.data && data.data.records) {
      const filteredRecords = data.data.records
        .filter((record: any) => record.scheduleId === scheduleId)
        .map((record: any) => ({
          ...record,
          department: record.department || user.department || 'General'
        }))
      
      data.data.records = filteredRecords
      data.data.total = filteredRecords.length
      
      console.log(`📋 Found ${filteredRecords.length} maintenance records for schedule ${scheduleId}`)
    }

    // CRITICAL FIX: Retrieve checklist data from local database for schedule records
    if (data.success && data.data && data.data.records) {
      console.log('🔧 [Schedule Records GET] Retrieving checklist data from local database...');
      
      try {
        await connectToDatabase();
        
        // Get all record IDs
        const recordIds = data.data.records.map((record: any) => record.id);
        
        // Fetch checklist data for all records in one query
        const checklistDataList = await MaintenanceChecklistData.find({
          recordId: { $in: recordIds }
        }).lean();
        
        // Create a map for quick lookup
        const checklistDataMap = new Map();
        checklistDataList.forEach((item: any) => {
          checklistDataMap.set(item.recordId, item);
        });
        
        let recordsWithLocalData = 0;
        let recordsWithoutLocalData = 0;
        
        // Merge checklist data with each record
        data.data.records = data.data.records.map((record: any) => {
          const localChecklistData = checklistDataMap.get(record.id);
          
          if (localChecklistData) {
            recordsWithLocalData++;
            // Merge local checklist data
            record.generalChecklist = localChecklistData.generalChecklist || [];
            record.partsStatus = record.partsStatus?.map((part: any) => {
              const localPart = localChecklistData.partsStatus?.find((p: any) => p.partId === part.partId);
              if (localPart) {
                return {
                  ...part,
                  checklistItems: localPart.checklistItems || []
                };
              }
              return part;
            }) || [];
            record._checklistDataSource = 'local_database';
          } else {
            recordsWithoutLocalData++;
            // Ensure empty arrays exist
            if (!record.generalChecklist) record.generalChecklist = [];
            if (!record.categoryResults) record.categoryResults = [];
            record._checklistDataMissing = true;
            record._checklistDataSource = 'missing';
          }
          
          return record;
        });
        
        console.log(`  - Records with local checklist data: ${recordsWithLocalData}`);
        console.log(`  - Records without local checklist data: ${recordsWithoutLocalData}`);
        console.log('✅ [Schedule Records GET] Checklist data merged from local database');
        
      } catch (dbError) {
        console.error('❌ [Schedule Records GET] Failed to retrieve checklist data from local database:', dbError);
        
        // Fallback: ensure empty arrays exist
        data.data.records = data.data.records.map((record: any) => {
          if (!record.generalChecklist) record.generalChecklist = [];
          if (!record.categoryResults) record.categoryResults = [];
          record._checklistDataMissing = true;
          record._checklistDataSource = 'error';
          return record;
        });
      }
    }
    
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching maintenance records for schedule:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
