import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import BannerMessage from '@/models/BannerMessage';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const isActive = searchParams.get('isActive');

    // Build query
    let query: any = {};
    
    // Filter by active status if specified
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Fetch banner messages sorted by priority (desc) and creation date (desc)
    const bannerMessages = await BannerMessage.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Transform the data to match frontend interface
    const transformedMessages = bannerMessages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      isActive: msg.isActive,
      priority: msg.priority,
      createdBy: msg.createdBy,
      createdByName: msg.createdByName,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    console.log(`🎌 [BANNER-API] Fetched ${transformedMessages.length} banner messages`);

    return NextResponse.json({
      success: true,
      bannerMessages: transformedMessages,
      total: transformedMessages.length
    });

  } catch (error) {
    console.error('Banner Messages API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
        { success: false, message: 'Insufficient permissions. Only administrators can create banner messages.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { text, priority, isActive } = body;

    // Validate input
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

    if (priority && (priority < 1 || priority > 10)) {
      return NextResponse.json(
        { success: false, message: 'Priority must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Create new banner message
    const bannerMessage = new BannerMessage({
      text: text.trim(),
      priority: priority || 5,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user.id,
      createdByName: user.name,
    });

    const savedBanner = await bannerMessage.save();

    // Transform the saved data to match frontend interface
    const transformedBanner = {
      id: (savedBanner._id as any).toString(),
      text: savedBanner.text,
      isActive: savedBanner.isActive,
      priority: savedBanner.priority,
      createdBy: savedBanner.createdBy,
      createdByName: savedBanner.createdByName,
      createdAt: savedBanner.createdAt.toISOString(),
      updatedAt: savedBanner.updatedAt.toISOString(),
    };

    console.log(`🎌 [BANNER-API] Created new banner message: ${text.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      message: 'Banner message created successfully',
      bannerMessage: transformedBanner
    }, { status: 201 });

  } catch (error: any) {
    console.error('Banner Message Creation Error:', error);
    
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
