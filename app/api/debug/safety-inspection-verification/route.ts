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

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { success: false, message: 'Record ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Find the safety inspection record
    const record = await db.collection('safetyinspectionrecords').findOne({ _id: new ObjectId(recordId) });
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Safety inspection record not found' },
        { status: 404 }
      );
    }

    // Also get user's employee record for comparison
    const employee = await db.collection('employees').findOne({ email: user.email });

    const debugInfo = {
      userFromToken: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        accessLevel: user.accessLevel
      },
      userFromDatabase: employee ? {
        id: employee._id?.toString(),
        name: employee.name,
        email: employee.email,
        department: employee.department,
        accessLevel: employee.accessLevel
      } : null,
      safetyInspectionRecord: {
        id: record._id?.toString(),
        department: record.department,
        inspector: record.inspector,
        inspectorId: record.inspectorId,
        assetName: record.assetName,
        status: record.status,
        adminVerified: record.adminVerified,
        createdAt: record.createdAt,
        completedDate: record.completedDate
      },
      departmentComparison: {
        tokenDept: user.department,
        recordDept: record.department,
        dbDept: employee?.department,
        exactMatch: user.department === record.department,
        caseInsensitiveMatch: (user.department || '').toLowerCase().trim() === (record.department || '').toLowerCase().trim(),
        tokenVsDb: user.department === employee?.department
      },
      canVerify: {
        isSuperAdmin: user.accessLevel === 'super_admin',
        isDepartmentAdmin: user.accessLevel === 'department_admin',
        departmentMatches: user.department === record.department,
        caseInsensitiveDepartmentMatches: (user.department || '').toLowerCase().trim() === (record.department || '').toLowerCase().trim(),
        recordCompleted: record.status === 'completed',
        notAlreadyVerified: !record.adminVerified
      }
    };

    return NextResponse.json({
      success: true,
      data: debugInfo
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
