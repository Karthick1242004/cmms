import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserContext } from "@/lib/auth-helpers"

// User notification state schema
interface UserNotificationState {
  userId: string
  userEmail: string
  lastDismissedAt?: Date
  readNotifications: string[] // Array of notification IDs that user has read
  dismissedPopup: boolean // Whether user has dismissed the popup for current alerts
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    const userState = await db.collection("userNotificationStates").findOne({
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: userState || {
        userId: user.id,
        userEmail: user.email,
        readNotifications: [],
        dismissedPopup: false,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

  } catch (error) {
    console.error("Error fetching user notification state:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch user notification state" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    const updateData = {
      userId: user.id,
      userEmail: user.email,
      ...body,
      updatedAt: new Date()
    }

    // Upsert user notification state
    const result = await db.collection("userNotificationStates").updateOne(
      { userId: user.id },
      { 
        $set: updateData,
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      data: updateData
    })

  } catch (error) {
    console.error("Error updating user notification state:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update user notification state" },
      { status: 500 }
    )
  }
}
