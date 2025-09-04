import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Location from '@/models/Location';

// Helper function to fetch assets for a location
async function fetchAssetsForLocation(request: NextRequest, locationName: string) {
  try {
    // Extract authentication token from the incoming request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      console.warn('No authentication token available for asset fetching');
      return [];
    }

    // Call the Next.js assets API to get assets for this location
    const response = await fetch(`${request.nextUrl.origin}/api/assets?location=${encodeURIComponent(locationName)}&limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch assets for location: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.data?.assets || [];
  } catch (error) {
    console.error('Error fetching assets for location:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    // Connect to local MongoDB
    await connectDB();

    // Find location by ID
    const location = await Location.findById(id).lean();
    
    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this location's department (unless super_admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && location.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Fetch linked assets for this location
    const linkedAssets = await fetchAssetsForLocation(request, location.name);

    // Calculate total asset value
    const totalAssetValue = linkedAssets.reduce((sum: number, asset: any) => {
      return sum + (asset.currentValue || asset.purchasePrice || 0);
    }, 0);

    // Transform _id to id for frontend compatibility and add asset data
    const transformedLocation = {
      ...location,
      id: location._id,
      _id: undefined,
      linkedAssets: linkedAssets.map((asset: any) => ({
        id: asset.id || asset._id,
        assetName: asset.assetName,
        assetCode: asset.assetCode,
        category: asset.category,
        status: asset.statusText || asset.status || 'Unknown',
        condition: asset.condition,
        purchasePrice: asset.purchasePrice || 0,
        currentValue: asset.currentValue || asset.purchasePrice || 0,
        location: asset.location,
        department: asset.department,
        assignedTo: asset.assignedTo || '',
        lastMaintenanceDate: asset.lastMaintenanceDate || '',
        nextMaintenanceDate: asset.nextMaintenanceDate || '',
        createdAt: asset.createdAt
      })),
      assetCount: linkedAssets.length,
      totalAssetValue: totalAssetValue
    };

    return NextResponse.json({
      success: true,
      data: transformedLocation,
      message: 'Location retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication and authorization (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    const body = await request.json();

    // Connect to local MongoDB
    await connectDB();

    // First, get the existing location to check permissions
    const existingLocation = await Location.findById(id);
    
    if (!existingLocation) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this location's department (unless super_admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && existingLocation.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Prevent non-super_admin users from changing department
    if (user && user.accessLevel !== 'super_admin' && body.department && body.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Cannot change location department' },
        { status: 403 }
      );
    }

    // Add update information (if user is authenticated)
    if (user) {
      body.updatedBy = user.name;
      body.updatedById = user.id;
    }

    // Update the location
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Location updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication and authorization (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    // Connect to local MongoDB
    await connectDB();

    // First, get the existing location to check permissions
    const existingLocation = await Location.findById(id);
    
    if (!existingLocation) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this location's department (unless super_admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && existingLocation.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Delete the location
    await Location.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting location' },
      { status: 500 }
    );
  }
} 