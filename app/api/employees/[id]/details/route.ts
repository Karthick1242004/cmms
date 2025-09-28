import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB, { connectToDatabase } from '@/lib/mongodb'
import Employee from '@/models/Employee'
import { ObjectId } from 'mongodb'

const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_BASE_URL || 'http://localhost:5001'

// Helper function to get user from JWT token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    await connectDB()
    return await Employee.findById(decoded.userId).select('-password')
  } catch (error) {
    return null
  }
}

// Helper function to calculate performance metrics from actual data
async function calculatePerformanceMetrics(employee: any) {
  try {
    const { db } = await connectToDatabase()
    
    
    // Get employee work data from different collections
    const employeeId = employee._id.toString()
    
    // 1. Daily Log Activities
    // More comprehensive search to catch all possible field variations
    const searchQuery = {
      $or: [
        // Search by employee ID
        { assignedTo: employeeId },
        { attendedBy: employeeId },
        { createdBy: employeeId },
        { updatedBy: employeeId },
        
        // Search by employee name (exact match)
        { assignedToName: employee.name },
        { attendedByName: employee.name },
        { createdByName: employee.name },
        { updatedByName: employee.name },
        
        // Search by employee name with case insensitive regex
        { assignedToName: { $regex: employee.name, $options: 'i' } },
        { attendedByName: { $regex: employee.name, $options: 'i' } },
        { createdByName: { $regex: employee.name, $options: 'i' } },
        { updatedByName: { $regex: employee.name, $options: 'i' } },
        
        // Alternative field names that might be used
        { assignedUser: employee.name },
        { attendedUser: employee.name },
        { assignedEmployee: employee.name },
        { attendedEmployee: employee.name },
        
        // Case insensitive for alternative fields
        { assignedUser: { $regex: employee.name, $options: 'i' } },
        { attendedUser: { $regex: employee.name, $options: 'i' } },
        { assignedEmployee: { $regex: employee.name, $options: 'i' } },
        { attendedEmployee: { $regex: employee.name, $options: 'i' } },
        
        // Array fields (for attendees lists)
        { attendees: { $elemMatch: { name: employee.name } } },
        { attendees: { $elemMatch: { name: { $regex: employee.name, $options: 'i' } } } },
        { attendees: { $elemMatch: { employeeName: employee.name } } },
        { attendees: { $elemMatch: { employeeName: { $regex: employee.name, $options: 'i' } } } },
        { attendees: { $elemMatch: { userId: employeeId } } },
        { attendees: { $elemMatch: { employeeId: employeeId } } },
        
        // Simple array search (if attendees is just array of names or IDs)
        { attendees: employee.name },
        { attendees: employeeId },
        { attendees: { $in: [employee.name, employeeId] } },
        
        // Additional attendee field variations
        { attendeeNames: { $in: [employee.name] } },
        { attendeeIds: { $in: [employeeId] } },
        { participants: { $in: [employee.name, employeeId] } },
        { members: { $in: [employee.name, employeeId] } }
      ]
    }
    
    
    const dailyActivities = await db.collection('dailylogactivities').find(searchQuery).toArray()
    
    
    
    // 2. Tickets (if any are assigned to this user)
    const ticketQuery = {
      $or: [
        // Search by employee name
        { loggedBy: employee.name },
        { assignedUsers: employee.name },
        { createdBy: employee.name },
        { assignedTo: employee.name },
        
        // Case insensitive search
        { loggedBy: { $regex: employee.name, $options: 'i' } },
        { assignedUsers: { $regex: employee.name, $options: 'i' } },
        { createdBy: { $regex: employee.name, $options: 'i' } },
        { assignedTo: { $regex: employee.name, $options: 'i' } },
        
        // Search by employee ID
        { loggedBy: employeeId },
        { assignedUsers: employeeId },
        { createdBy: employeeId },
        { assignedTo: employeeId },
        
        // Array fields (in case assignedUsers is an array)
        { assignedUsers: { $in: [employee.name, employeeId] } }
      ]
    }
    
    const tickets = await db.collection('tickets').find(ticketQuery).toArray()
    
    // 3. Maintenance tasks (if maintenance collection exists)
    let maintenanceTasks = []
    try {
      const maintenanceQuery = {
        $or: [
          // Search by employee ID
          { assignedTo: employeeId },
          { createdBy: employeeId },
          { updatedBy: employeeId },
          
          // Search by employee name
          { assignedToName: employee.name },
          { createdByName: employee.name },
          { updatedByName: employee.name },
          
          // Case insensitive search
          { assignedToName: { $regex: employee.name, $options: 'i' } },
          { createdByName: { $regex: employee.name, $options: 'i' } },
          { updatedByName: { $regex: employee.name, $options: 'i' } },
          
          // Alternative field names
          { assignedUser: employee.name },
          { assignedEmployee: employee.name },
          { assignedUser: { $regex: employee.name, $options: 'i' } },
          { assignedEmployee: { $regex: employee.name, $options: 'i' } }
        ]
      }
      
      maintenanceTasks = await db.collection('maintenance').find(maintenanceQuery).toArray()
    } catch (error) {
      // No maintenance collection found
    }
    
    
    // 4. Safety Inspections (if safety inspection collection exists)
    let safetyInspections = []
    try {
      const safetyQuery = {
        $or: [
          // Search by employee ID
          { assignedTo: employeeId },
          { createdBy: employeeId },
          { updatedBy: employeeId },
          { inspectedBy: employeeId },
          
          // Search by employee name
          { assignedToName: employee.name },
          { createdByName: employee.name },
          { updatedByName: employee.name },
          { inspectedByName: employee.name },
          
          // Case insensitive search
          { assignedToName: { $regex: employee.name, $options: 'i' } },
          { createdByName: { $regex: employee.name, $options: 'i' } },
          { updatedByName: { $regex: employee.name, $options: 'i' } },
          { inspectedByName: { $regex: employee.name, $options: 'i' } },
          
          // Alternative field names
          { assignedUser: employee.name },
          { assignedEmployee: employee.name },
          { inspector: employee.name },
          { assignedUser: { $regex: employee.name, $options: 'i' } },
          { assignedEmployee: { $regex: employee.name, $options: 'i' } },
          { inspector: { $regex: employee.name, $options: 'i' } }
        ]
      }
      
      safetyInspections = await db.collection('safetyinspections').find(safetyQuery).toArray()
    } catch (error) {
      // No safety inspections collection found
    }
    
    
    // Calculate metrics
    const completedDailyActivities = dailyActivities.filter(activity => 
      ['completed', 'verified', 'resolved'].includes(activity.status)
    )
    
    const completedTickets = tickets.filter(ticket => 
      ['completed', 'closed', 'resolved'].includes(ticket.status?.toLowerCase())
    )
    
    const completedMaintenance = maintenanceTasks.filter(task => 
      ['completed', 'finished', 'done'].includes(task.status?.toLowerCase())
    )
    
    const completedSafetyInspections = safetyInspections.filter(inspection => 
      ['completed', 'passed', 'finished'].includes(inspection.status?.toLowerCase())
    )
    
    // Calculate total work hours from daily activities (assuming each activity represents work)
    const totalWorkHours = dailyActivities.length * 2 // Rough estimate: 2 hours per activity
    
    // Calculate average completion time (rough estimate)
    const averageCompletionTime = completedDailyActivities.length > 0 ? 
      totalWorkHours / completedDailyActivities.length : 0
    
    // Calculate efficiency (completed vs total)
    const totalTasks = dailyActivities.length + tickets.length + maintenanceTasks.length + safetyInspections.length
    const completedTasks = completedDailyActivities.length + completedTickets.length + completedMaintenance.length + completedSafetyInspections.length
    const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Calculate rating based on efficiency and work volume
    let rating = 1
    if (efficiency >= 90) rating = 5
    else if (efficiency >= 75) rating = 4
    else if (efficiency >= 60) rating = 3
    else if (efficiency >= 40) rating = 2
    
    const performanceMetrics = {
      totalTasksCompleted: completedTasks,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      ticketsResolved: completedTickets.length,
      maintenanceCompleted: completedMaintenance.length,
      safetyInspectionsCompleted: completedSafetyInspections.length,
      dailyLogEntries: completedDailyActivities.length,
      efficiency: efficiency,
      rating: rating,
      lastActivityDate: dailyActivities.length > 0 ? 
        dailyActivities.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0].updatedAt || dailyActivities[0].createdAt :
        null
    }
    
    
    // Build work history from all activities
    const workHistory = []
    
    // Add daily activities to work history
    dailyActivities.forEach(activity => {
      workHistory.push({
        type: 'daily-log',
        title: activity.natureOfProblem,
        description: activity.commentsOrSolution,
        assetName: activity.assetName,
        status: activity.status,
        date: activity.createdAt || activity.date,
        duration: 2 // Default duration estimate
      })
    })
    
    // Add tickets to work history
    tickets.forEach(ticket => {
      workHistory.push({
        type: 'ticket',
        title: ticket.title || ticket.subject,
        description: ticket.description,
        assetName: 'N/A',
        status: ticket.status,
        date: ticket.loggedDateTime || ticket.createdAt,
        duration: ticket.totalTime || null
      })
    })
    
    // Add maintenance tasks to work history
    maintenanceTasks.forEach(task => {
      workHistory.push({
        type: 'maintenance',
        title: task.title || task.taskTitle,
        description: task.description,
        assetName: task.assetName,
        status: task.status,
        date: task.createdAt || task.scheduledDate,
        duration: task.duration || null
      })
    })
    
    // Add safety inspections to work history
    safetyInspections.forEach(inspection => {
      workHistory.push({
        type: 'safety-inspection',
        title: inspection.title || inspection.inspectionType,
        description: inspection.description,
        assetName: inspection.assetName,
        status: inspection.status,
        date: inspection.createdAt || inspection.inspectionDate,
        duration: inspection.duration || null
      })
    })
    
    // Sort work history by date (most recent first)
    workHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    
    const finalResult = {
      performanceMetrics,
      workHistory: workHistory.slice(0, 50), // Limit to last 50 entries
      totalWorkHours,
      productivityScore: Math.min(100, Math.round((completedTasks / 10) * 100)),
      reliabilityScore: efficiency
    }
    
    
    return finalResult
    
  } catch (error) {
    console.error('Error calculating performance metrics:', error)
    return {
      performanceMetrics: {
        totalTasksCompleted: 0,
        averageCompletionTime: 0,
        ticketsResolved: 0,
        maintenanceCompleted: 0,
        safetyInspectionsCompleted: 0,
        dailyLogEntries: 0,
        efficiency: 0,
        rating: 1
      },
      workHistory: [],
      totalWorkHours: 0,
      productivityScore: 0,
      reliabilityScore: 0
    }
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // First try to get the employee from local database
    await connectDB()
    const employee = await Employee.findById(id).select('-password').lean()
    
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this employee
    if (user.accessLevel !== 'super_admin' && employee.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - You can only view employees from your department' },
        { status: 403 }
      )
    }


    // Calculate performance metrics from actual data
    const performanceData = await calculatePerformanceMetrics(employee)
    
    // Build the complete employee detail object
    const employeeDetail = {
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      role: employee.role,
      status: employee.status || 'active',
      avatar: employee.avatar || '/placeholder-user.jpg',
      employeeId: employee._id.toString(),
      joinDate: employee.joinDate || employee.createdAt || '',
      supervisor: employee.supervisor || '',
      accessLevel: employee.accessLevel || 'normal_user',
      workShift: employee.workShift || 'Day',
      skills: employee.skills || [],
      certifications: employee.certifications || [],
      emergencyContact: employee.emergencyContact || null,
      
      // Performance data calculated from actual activities
      workHistory: performanceData.workHistory,
      assetAssignments: [], // TODO: Implement asset assignments if needed
      currentAssignments: [], // TODO: Implement current assignments if needed
      performanceMetrics: performanceData.performanceMetrics,
      totalWorkHours: performanceData.totalWorkHours,
      productivityScore: performanceData.productivityScore,
      reliabilityScore: performanceData.reliabilityScore,
      
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }


    return NextResponse.json({
      success: true,
      data: employeeDetail,
      message: 'Employee details retrieved successfully'
    })
    
  } catch (error) {
    console.error('Error fetching employee details:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}