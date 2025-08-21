import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Location from '@/models/Location';

// Backend server URL for fetching assets
const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to fetch asset counts by location from the backend
async function fetchAssetCountsByLocation(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/assets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch assets for location count calculation');
      return {};
    }

    const data = await response.json();
    const assets = data.data?.assets || [];

    // Count assets by location
    const locationCounts: Record<string, number> = {};
    assets.forEach((asset: any) => {
      if (asset.location) {
        locationCounts[asset.location] = (locationCounts[asset.location] || 0) + 1;
      }
    });

    return locationCounts;
  } catch (error) {
    console.error('Error fetching assets for location count:', error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Note: GET locations is public (no auth required). All users can view locations.

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    
    // Build filter query - no department filtering, all users see all locations
    const filter: any = {};
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply type filter if provided
    if (type) {
      filter.type = type;
    }
    
    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [locations, totalCount] = await Promise.all([
      Location.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Location.countDocuments(filter)
    ]);

    // Fetch asset counts from the backend server
    const assetCounts = await fetchAssetCountsByLocation();

    // Transform _id to id for frontend compatibility and update asset counts
    const transformedLocations = locations.map(location => ({
      ...location,
      id: location._id,
      _id: undefined,
      assetCount: assetCounts[location.name] || 0 // Use location name to match assets
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        locations: transformedLocations,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrevious
        }
      },
      message: 'Locations retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching locations' },
      { status: 500 }
    );
  }
}

// Helper function to update asset counts for all locations
export async function updateAllLocationAssetCounts() {
  try {
    await connectDB();
    
    const assetCounts = await fetchAssetCountsByLocation();
    
    // Update all locations with their current asset counts
    const updatePromises = Object.entries(assetCounts).map(([locationName, count]) =>
      Location.updateOne(
        { name: locationName },
        { $set: { assetCount: count } }
      )
    );
    
    // Reset count to 0 for locations with no assets
    const locationsWithAssets = Object.keys(assetCounts);
    await Location.updateMany(
      { name: { $nin: locationsWithAssets } },
      { $set: { assetCount: 0 } }
    );
    
    await Promise.all(updatePromises);
    
    console.log('Successfully updated asset counts for all locations');
    return true;
  } catch (error) {
    console.error('Error updating location asset counts:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.code || !body.type || !body.department) {
      return NextResponse.json(
        { success: false, message: 'Location name, code, type, and department are required' },
        { status: 400 }
      );
    }

    // Add created by information
    body.createdBy = user.name;
    body.createdById = user.id;

    // Create new location
    const location = new Location(body);
    await location.save();

    return NextResponse.json({
      success: true,
      data: location,
      message: 'Location created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating location:', error);
    
    if (error.code === 11000) {
      // Duplicate key error (likely the code field)
      return NextResponse.json(
        { success: false, message: 'Location code already exists. Please use a unique code.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error while creating location' },
      { status: 500 }
    );
  }
} 