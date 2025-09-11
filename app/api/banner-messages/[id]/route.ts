import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import BannerMessage from '@/models/BannerMessage';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid banner message ID' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find banner message
    const bannerMessage = await BannerMessage.findById(id).lean();

    if (!bannerMessage) {
      return NextResponse.json(
        { success: false, message: 'Banner message not found' },
        { status: 404 }
      );
    }

    // Transform the data to match frontend interface
    const transformedBanner = {
      id: bannerMessage._id.toString(),
      text: bannerMessage.text,
      isActive: bannerMessage.isActive,
      priority: bannerMessage.priority,
      createdBy: bannerMessage.createdBy,
      createdByName: bannerMessage.createdByName,
      createdAt: bannerMessage.createdAt.toISOString(),
      updatedAt: bannerMessage.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      bannerMessage: transformedBanner
    });

  } catch (error) {
    console.error('Banner Message GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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

    // Get user context for authentication and permissions
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Only administrators can update banner messages.' },
        { status: 403 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid banner message ID' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { text, priority, isActive } = body;

    // Validate input
    if (text !== undefined) {
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Banner text is required' },
          { status: 400 }
        );
      }
      if (text.length > 200) {
        return NextResponse.json(
          { success: false, message: 'Banner text must be less than 200 characters' },
          { status: 400 }
        );
      }
    }

    if (priority !== undefined && (priority < 1 || priority > 10)) {
      return NextResponse.json(
        { success: false, message: 'Priority must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData: any = {};
    if (text !== undefined) updateData.text = text.trim();
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update banner message
    const updatedBanner = await BannerMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedBanner) {
      return NextResponse.json(
        { success: false, message: 'Banner message not found' },
        { status: 404 }
      );
    }

    // Transform the data to match frontend interface
    const transformedBanner = {
      id: updatedBanner._id.toString(),
      text: updatedBanner.text,
      isActive: updatedBanner.isActive,
      priority: updatedBanner.priority,
      createdBy: updatedBanner.createdBy,
      createdByName: updatedBanner.createdByName,
      createdAt: updatedBanner.createdAt.toISOString(),
      updatedAt: updatedBanner.updatedAt.toISOString(),
    };

    console.log(`🎌 [BANNER-API] Updated banner message: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Banner message updated successfully',
      bannerMessage: transformedBanner
    });

  } catch (error) {
    console.error('Banner Message Update Error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, message: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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

    // Get user context for authentication and permissions
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Only administrators can delete banner messages.' },
        { status: 403 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid banner message ID' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and delete banner message
    const deletedBanner = await BannerMessage.findByIdAndDelete(id).lean();

    if (!deletedBanner) {
      return NextResponse.json(
        { success: false, message: 'Banner message not found' },
        { status: 404 }
      );
    }

    console.log(`🎌 [BANNER-API] Deleted banner message: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Banner message deleted successfully'
    });

  } catch (error) {
    console.error('Banner Message Delete Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
