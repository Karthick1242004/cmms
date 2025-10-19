import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';

// Admin email with access to approve feedback
const ADMIN_EMAIL = 'tyjdemo@tyjfood.com';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admin can approve feedback
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Only admin can approve feedback' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const { signatureData, signatureType, approvalComments } = body;

    if (!signatureData) {
      return NextResponse.json(
        { success: false, message: 'Signature is required for approval' },
        { status: 400 }
      );
    }

    if (!signatureType || !['text', 'image'].includes(signatureType)) {
      return NextResponse.json(
        { success: false, message: 'Valid signature type (text or image) is required' },
        { status: 400 }
      );
    }

    // Find and update feedback
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update with approval data
    feedback.isApproved = true;
    feedback.approvedBy = user.id;
    feedback.approvedByName = user.name || 'Admin';
    feedback.approvedByEmail = user.email || '';
    feedback.approvedAt = new Date();
    feedback.signatureData = signatureData;
    feedback.signatureType = signatureType;
    feedback.approvalComments = approvalComments || '';

    await feedback.save();

    console.log('✅ [FEEDBACK APPROVAL] Feedback approved:', {
      id: feedback._id,
      company: feedback.companyName,
      approvedBy: feedback.approvedByName,
      hasSignature: !!feedback.signatureData
    });

    // Transform feedback to include all approval fields
    const feedbackData = feedback.toObject();
    const responseData = {
      ...feedbackData,
      id: feedbackData._id.toString(),
      _id: feedbackData._id.toString(),
      isApproved: feedbackData.isApproved,
      approvedBy: feedbackData.approvedBy,
      approvedByName: feedbackData.approvedByName,
      approvedByEmail: feedbackData.approvedByEmail,
      approvedAt: feedbackData.approvedAt,
      signatureData: feedbackData.signatureData,
      signatureType: feedbackData.signatureType,
      approvalComments: feedbackData.approvalComments,
    };

    console.log('✅ [FEEDBACK APPROVAL] Returning data with signature:', {
      hasSignature: !!responseData.signatureData,
      signatureLength: responseData.signatureData?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Feedback approved successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [FEEDBACK APPROVAL] Error approving feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

