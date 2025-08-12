import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { departmentId: string } }
) {
  try {
    const { departmentId } = params;

    if (!departmentId) {
      return NextResponse.json(
        { success: false, message: 'Department ID is required' },
        { status: 400 }
      );
    }

    // Get user context for headers
    const user = await getUserContext(request);
    
    // First, get the department name from departments API
    const departmentsHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      departmentsHeaders['x-user-id'] = user.id;
      departmentsHeaders['x-user-name'] = user.name;
      departmentsHeaders['x-user-email'] = user.email;
      departmentsHeaders['x-user-department'] = user.department;
      departmentsHeaders['x-user-role'] = user.role;
    }

    // Get department details to get the department name
    const departmentResponse = await fetch(`${SERVER_BASE_URL}/api/departments/${departmentId}`, {
      method: 'GET',
      headers: departmentsHeaders,
    });

    if (!departmentResponse.ok) {
      // If we can't find the department, try to get all departments and find by ID
      const allDepartmentsResponse = await fetch(`${SERVER_BASE_URL}/api/departments`, {
        method: 'GET',
        headers: departmentsHeaders,
      });

      if (!allDepartmentsResponse.ok) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch department information' },
          { status: 404 }
        );
      }

      const departmentsData = await allDepartmentsResponse.json();
      const department = departmentsData.data?.departments?.find((dept: any) => dept.id === departmentId);
      
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Department not found' },
          { status: 404 }
        );
      }

      // Now get assets for this department by name
      const assetsHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add user context headers if available
      if (user) {
        assetsHeaders['x-user-id'] = user.id;
        assetsHeaders['x-user-name'] = user.name;
        assetsHeaders['x-user-email'] = user.email;
        assetsHeaders['x-user-department'] = user.department;
        assetsHeaders['x-user-role'] = user.role;
      }

      const assetsUrl = `${SERVER_BASE_URL}/api/assets?department=${encodeURIComponent(department.name)}`;
      const assetsResponse = await fetch(assetsUrl, {
        method: 'GET',
        headers: assetsHeaders,
      });

      if (!assetsResponse.ok) {
        const errorData = await assetsResponse.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to fetch assets' },
          { status: assetsResponse.status }
        );
      }

      const assetsData = await assetsResponse.json();
      
      // Transform the assets data to match the expected format for daily log activities
      const transformedAssets = assetsData.data?.assets?.map((asset: any) => ({
        _id: asset.id,
        assetName: asset.assetName,
        category: asset.category,
        condition: asset.condition || 'good',
        statusText: asset.statusText || asset.serviceStatus || 'Operational'
      })) || [];

      return NextResponse.json({
        success: true,
        data: transformedAssets,
        message: 'Assets retrieved successfully'
      }, { status: 200 });

    } else {
      // We got the department details successfully
      const departmentData = await departmentResponse.json();
      const departmentName = departmentData.data?.name;

      if (!departmentName) {
        return NextResponse.json(
          { success: false, message: 'Invalid department data' },
          { status: 400 }
        );
      }

      // Now get assets for this department by name
      const assetsHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add user context headers if available
      if (user) {
        assetsHeaders['x-user-id'] = user.id;
        assetsHeaders['x-user-name'] = user.name;
        assetsHeaders['x-user-email'] = user.email;
        assetsHeaders['x-user-department'] = user.department;
        assetsHeaders['x-user-role'] = user.role;
      }

      const assetsUrl = `${SERVER_BASE_URL}/api/assets?department=${encodeURIComponent(departmentName)}`;
      const assetsResponse = await fetch(assetsUrl, {
        method: 'GET',
        headers: assetsHeaders,
      });

      if (!assetsResponse.ok) {
        const errorData = await assetsResponse.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to fetch assets' },
          { status: assetsResponse.status }
        );
      }

      const assetsData = await assetsResponse.json();
      
      // Transform the assets data to match the expected format for daily log activities
      const transformedAssets = assetsData.data?.assets?.map((asset: any) => ({
        _id: asset.id,
        assetName: asset.assetName,
        category: asset.category,
        condition: asset.condition || 'good',
        statusText: asset.statusText || asset.serviceStatus || 'Operational'
      })) || [];

      return NextResponse.json({
        success: true,
        data: transformedAssets,
        message: 'Assets retrieved successfully'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error fetching assets by department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching assets' },
      { status: 500 }
    );
  }
}
