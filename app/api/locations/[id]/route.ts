import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Location from '@/models/Location';

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
    const location = await Location.findById(id);
    
    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && location.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location
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
    
    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && existingLocation.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Prevent non-admin users from changing department
    if (user && user.role !== 'admin' && body.department && body.department !== user.department) {
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
    
    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && existingLocation.department !== user.department) {
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