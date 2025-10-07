import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';

// Admin email with access to all feedback responses
const ADMIN_EMAIL = 'tyjdemo@tyjfood.com';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['companyName', 'address', 'contactPersonName', 'designation', 'emailId', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate confirmation
    if (!body.confirmInformation) {
      return NextResponse.json(
        { success: false, message: 'You must confirm that the information is correct before submitting' },
        { status: 400 }
      );
    }

    // Create feedback with user metadata
    const feedbackData = {
      ...body,
      submittedBy: user.id,
      submittedByName: user.name || 'Unknown User',
      submittedByEmail: user.email || '',
      submittedByDepartment: user.department || '',
      submittedAt: new Date(),
    };

    const newFeedback = new Feedback(feedbackData);
    const savedFeedback = await newFeedback.save();

    console.log('✅ [FEEDBACK API] Feedback submitted successfully:', {
      id: savedFeedback._id,
      company: savedFeedback.companyName,
      submittedBy: savedFeedback.submittedByName
    });

    return NextResponse.json({
      success: true,
      data: savedFeedback.toJSON(),
      message: 'Feedback submitted successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [FEEDBACK API] Error creating feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admin can view all feedback responses
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Only admin can view feedback responses' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const companyName = searchParams.get('companyName');
    const industryType = searchParams.get('industryType');
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } },
        { emailId: { $regex: search, $options: 'i' } },
        { submittedByName: { $regex: search, $options: 'i' } }
      ];
    }

    if (companyName) {
      query.companyName = { $regex: companyName, $options: 'i' };
    }

    if (industryType) {
      query.industryType = industryType;
    }

    if (fromDate || toDate) {
      query.submittedAt = {};
      if (fromDate) query.submittedAt.$gte = new Date(fromDate);
      if (toDate) query.submittedAt.$lte = new Date(toDate);
    }

    // Count total documents
    const totalCount = await Feedback.countDocuments(query);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch feedbacks
    const feedbacks = await Feedback.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ [FEEDBACK API] Retrieved ${feedbacks.length} feedbacks for admin`);

    return NextResponse.json({
      success: true,
      data: {
        feedbacks: feedbacks.map(fb => ({
          ...fb,
          id: fb._id.toString(),
          _id: undefined
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [FEEDBACK API] Error fetching feedbacks:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

