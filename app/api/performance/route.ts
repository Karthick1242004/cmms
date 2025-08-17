import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PerformanceModel } from '@/models/Performance';
import { getUserContext } from '@/lib/auth-helpers';
import type { PerformanceInput } from '@/types/performance';

// GET - Fetch performance records
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const user = await getUserContext(request);
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Build query filter
    const filter: any = {};
    
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    
    if (department) {
      filter.department = department;
    } else if (user && user.accessLevel !== 'super_admin') {
      // Non-super admins can only see their department's performance data
      filter.department = user.department;
    }
    
    if (role) {
      filter.role = role;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const [performances, totalCount] = await Promise.all([
      PerformanceModel.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceModel.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;
    
    return NextResponse.json({
      success: true,
      data: {
        performances,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrevious
        }
      },
      message: 'Performance records retrieved successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching performance records:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch performance records'
    }, { status: 500 });
  }
}

// POST - Create or update performance record
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 PERFORMANCE API - POST request received');
    console.log('🎯 Request URL:', request.url);
    console.log('🎯 Request method:', request.method);
    console.log('🎯 Request headers:', Object.fromEntries(request.headers.entries()));
    
    await connectDB();
    console.log('🎯 PERFORMANCE API - Database connected successfully');
    
    const user = await getUserContext(request);
    console.log('🎯 PERFORMANCE API - User context:', user ? { id: user.id, name: user.name, department: user.department } : 'No user');
    
    const body: PerformanceInput = await request.json();
    console.log('🎯 PERFORMANCE API - Request body received:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.employeeId || !body.employeeName || !body.department) {
      return NextResponse.json({
        success: false,
        message: 'Employee ID, name, and department are required'
      }, { status: 400 });
    }
    
    // Check if performance record already exists for this employee
    let performanceRecord = await PerformanceModel.findOne({ 
      employeeId: body.employeeId 
    });
    
    if (performanceRecord) {
      // Update existing record
      const updatedRecord = await PerformanceModel.findOneAndUpdate(
        { employeeId: body.employeeId },
        {
          $set: {
            employeeName: body.employeeName,
            employeeEmail: body.employeeEmail,
            department: body.department,
            role: body.role,
            ...(body.workHistory && { workHistory: body.workHistory }),
            ...(body.assetAssignments && { assetAssignments: body.assetAssignments }),
            ...(body.currentAssignments && { currentAssignments: body.currentAssignments }),
            ...(body.performanceMetrics && { 
              performanceMetrics: {
                ...performanceRecord.performanceMetrics,
                ...body.performanceMetrics
              }
            }),
            ...(body.totalWorkHours !== undefined && { totalWorkHours: body.totalWorkHours }),
            ...(body.productivityScore !== undefined && { productivityScore: body.productivityScore }),
            ...(body.reliabilityScore !== undefined && { reliabilityScore: body.reliabilityScore }),
            updatedAt: new Date()
          }
        },
        { new: true, lean: true }
      );
      
      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: 'Performance record updated successfully'
      }, { status: 200 });
      
    } else {
      // Create new performance record
      const newPerformanceData = {
        employeeId: body.employeeId,
        employeeName: body.employeeName,
        employeeEmail: body.employeeEmail || '',
        department: body.department,
        role: body.role || '',
        workHistory: body.workHistory || [],
        assetAssignments: body.assetAssignments || [],
        currentAssignments: body.currentAssignments || [],
        performanceMetrics: {
          totalTasksCompleted: 0,
          averageCompletionTime: 0,
          ticketsResolved: 0,
          maintenanceCompleted: 0,
          safetyInspectionsCompleted: 0,
          dailyLogEntries: 0,
          efficiency: 0,
          rating: 0,
          ...body.performanceMetrics
        },
        totalWorkHours: body.totalWorkHours || 0,
        productivityScore: body.productivityScore || 0,
        reliabilityScore: body.reliabilityScore || 0
      };
      
      const createdRecord = await PerformanceModel.create(newPerformanceData);
      
      return NextResponse.json({
        success: true,
        data: createdRecord,
        message: 'Performance record created successfully'
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Error creating/updating performance record:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create/update performance record'
    }, { status: 500 });
  }
}
