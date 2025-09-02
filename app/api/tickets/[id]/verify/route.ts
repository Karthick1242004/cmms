import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import connectDB, { connectToDatabase } from '@/lib/mongodb'
import Ticket from '@/models/Ticket'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 [Ticket Verify API] - Starting verification process')
    
    // Get user context
    const userContext = await getUserContext(request)
    if (!userContext) {
      console.log('❌ [Ticket Verify API] - No user context')
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { user } = userContext
    console.log('👤 [Ticket Verify API] - User:', user.name, 'Access Level:', user.accessLevel)

    // Check if user has admin privileges
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      console.log('❌ [Ticket Verify API] - Insufficient privileges')
      return NextResponse.json(
        { success: false, message: 'Only admins can verify tickets' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { adminNotes } = body

    console.log('📋 [Ticket Verify API] - Ticket ID:', id)
    console.log('📝 [Ticket Verify API] - Admin notes:', adminNotes)

    // Connect to databases
    await connectDB()
    const { db } = await connectToDatabase()

    // Find the ticket
    const ticket = await Ticket.findById(id)
    if (!ticket) {
      console.log('❌ [Ticket Verify API] - Ticket not found')
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }

    console.log('🎫 [Ticket Verify API] - Found ticket:', ticket.ticketId, 'Status:', ticket.status)

    // Check if user can verify this ticket (department admin can only verify their department tickets)
    if (user.accessLevel === 'department_admin' && ticket.department !== user.department) {
      console.log('❌ [Ticket Verify API] - Department mismatch:', ticket.department, 'vs', user.department)
      return NextResponse.json(
        { success: false, message: 'You can only verify tickets in your department' },
        { status: 403 }
      )
    }

    // Check if ticket can be verified (must be completed and not already verified)
    if (ticket.status !== 'completed') {
      console.log('❌ [Ticket Verify API] - Invalid status for verification:', ticket.status)
      return NextResponse.json(
        { success: false, message: 'Only completed tickets can be verified' },
        { status: 400 }
      )
    }

    if (ticket.adminVerified) {
      console.log('❌ [Ticket Verify API] - Ticket already verified')
      return NextResponse.json(
        { success: false, message: 'Ticket is already verified' },
        { status: 400 }
      )
    }

    // Update ticket with verification
    const updateData: any = {
      $set: {
        status: 'verified',
        adminVerified: true,
        verifiedBy: user.id,
        verifiedByName: user.name,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      $push: {
        activityHistory: {
          timestamp: new Date().toISOString(),
          action: 'verified',
          performedBy: user.id,
          performedByName: user.name,
          details: `Ticket verified by ${user.name}`,
          previousValue: 'completed',
          newValue: 'verified'
        }
      }
    }

    if (adminNotes) {
      updateData.$set.adminNotes = adminNotes
    }

    // Update the ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!updatedTicket) {
      console.log('❌ [Ticket Verify API] - Failed to update ticket')
      return NextResponse.json(
        { success: false, message: 'Failed to verify ticket' },
        { status: 500 }
      )
    }

    console.log('✅ [Ticket Verify API] - Ticket verified successfully')

    // Create asset activity log entry if ticket has an asset
    if (updatedTicket.equipmentId) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
        const baseUrl = `${protocol}://${host}`
        
        console.log('📝 [Ticket Verify API] - Creating asset activity log')

        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: updatedTicket.equipmentId,
            title: `Ticket Verified - ${updatedTicket.ticketId}`,
            description: `Ticket "${updatedTicket.subject}" has been verified by admin ${user.name}`,
            type: 'verification',
            status: 'completed',
            priority: updatedTicket.priority,
            assignedTo: user.id,
            assignedToName: user.name,
            department: updatedTicket.department,
            metadata: {
              ticketId: updatedTicket.ticketId,
              verifiedBy: user.name,
              verifiedAt: new Date().toISOString(),
              adminNotes: adminNotes
            }
          })
        })

        if (activityLogResponse.ok) {
          console.log('✅ [Ticket Verify API] - Asset activity log created')
        } else {
          console.warn('⚠️ [Ticket Verify API] - Failed to create asset activity log')
        }
      } catch (error) {
        console.warn('⚠️ [Ticket Verify API] - Error creating asset activity log:', error)
      }
    }

    // Transform the response to match frontend expectations
    const transformedTicket = {
      ...updatedTicket.toJSON(),
      id: updatedTicket._id.toString(),
      subject: updatedTicket.title || updatedTicket.subject,
      _id: undefined
    }

    return NextResponse.json({
      success: true,
      data: transformedTicket,
      message: 'Ticket verified successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ [Ticket Verify API] - Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during verification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
