import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const criticalAlerts = []
    
    // Check for low stock alerts
    const parts = await db.collection("parts").find({}).toArray()
    const lowStockParts = parts.filter(part => 
      part.quantity <= part.minStockLevel && part.minStockLevel > 0
    )
    
    lowStockParts.forEach(part => {
      criticalAlerts.push({
        type: part.quantity === 0 ? "critical" : "warning",
        title: part.quantity === 0 ? "Out of Stock Alert" : "Low Stock Alert", 
        message: part.quantity === 0 
          ? `${part.name} (Part #${part.partNumber}) is out of stock. Immediate restocking required.`
          : `${part.name} (Part #${part.partNumber}) is low on stock (${part.quantity} units remaining). Minimum threshold: ${part.minStockLevel} units.`,
        category: "stock",
        actionUrl: "/parts",
        actionLabel: "View Parts",
        relatedId: part._id,
        timestamp: new Date()
      })
    })

    // Also check for parts approaching low stock (within 20% of minimum)
    const approachingLowStock = parts.filter(part => 
      part.quantity > part.minStockLevel && 
      part.quantity <= (part.minStockLevel * 1.2) && 
      part.minStockLevel > 0
    )
    
    approachingLowStock.forEach(part => {
      criticalAlerts.push({
        type: "info",
        title: "Stock Level Notice", 
        message: `${part.name} (Part #${part.partNumber}) is approaching minimum stock level (${part.quantity} units remaining). Consider restocking soon.`,
        category: "stock",
        actionUrl: "/parts",
        actionLabel: "View Parts",
        relatedId: part._id,
        timestamp: new Date()
      })
    })

    // Check for equipment issues based on actual data structure
    const assets = await db.collection("assets").find({
      $or: [
        { statusText: { $regex: /out.*of.*service|maintenance.*required|failure|critical|down|offline/i } },
        { outOfOrder: "Yes" },
        { isActive: "No" }
      ]
    }).toArray()
    
    assets.forEach(asset => {
      let alertType = "warning"
      let title = "Equipment Attention Required"
      let message = `${asset.assetName || asset.name} requires attention.`
      
      if (asset.outOfOrder === "Yes" || 
          (asset.statusText && asset.statusText.toLowerCase().includes("failure"))) {
        alertType = "critical"
        title = "Equipment Issue"
        message = `${asset.assetName || asset.name} has reported an issue. Check equipment status immediately.`
      }
      
      criticalAlerts.push({
        type: alertType,
        title,
        message,
        category: "equipment",
        actionUrl: `/assets/${asset._id}`,
        actionLabel: "View Equipment",
        relatedId: asset._id,
        timestamp: new Date()
      })
    })

    // Add informational alerts for assets that need routine check
    const assetsForRoutineCheck = await db.collection("assets").find({
      statusText: { $regex: /new|available/i }
    }).limit(2).toArray()
    
    assetsForRoutineCheck.forEach(asset => {
      criticalAlerts.push({
        type: "info",
        title: "Routine Check Recommended",
        message: `${asset.assetName || asset.name} is ready for routine inspection or commissioning.`,
        category: "routine",
        actionUrl: `/assets/${asset._id}`,
        actionLabel: "View Asset",
        relatedId: asset._id,
        timestamp: new Date()
      })
    })

    // Check for maintenance records that indicate issues
    const maintenanceRecords = await db.collection("maintenancerecords").find({
      status: { $in: ["failed", "partially_completed"] }
    }).sort({ createdAt: -1 }).limit(5).toArray()
    
    maintenanceRecords.forEach(record => {
      criticalAlerts.push({
        type: record.status === "failed" ? "critical" : "warning",
        title: record.status === "failed" ? "Maintenance Failed" : "Maintenance Issue",
        message: `${record.assetName || 'Asset'} maintenance ${record.status === "failed" ? "failed" : "partially completed"}. Review and reschedule maintenance.`,
        category: "maintenance",
        actionUrl: "/maintenance",
        actionLabel: "View Maintenance",
        relatedId: record._id,
        timestamp: new Date()
      })
    })

    // Check for high workload - too many open tickets
    const openTickets = await db.collection("tickets").find({
      status: { $in: ["open", "in_progress"] }
    }).toArray()
    
    if (openTickets.length > 10) {
      criticalAlerts.push({
        type: "warning",
        title: "High Workload Alert",
        message: `${openTickets.length} tickets are currently open or in progress. Consider reviewing workload distribution.`,
        category: "workload",
        actionUrl: "/tickets",
        actionLabel: "View Tickets",
        relatedId: "workload-alert",
        timestamp: new Date()
      })
    }

    // Sort by severity and date (critical first, then by most recent)
    criticalAlerts.sort((a, b) => {
      if (a.type === "critical" && b.type !== "critical") return -1
      if (b.type === "critical" && a.type !== "critical") return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json({
      success: true,
      alerts: criticalAlerts,
      totalCount: criticalAlerts.length,
      criticalCount: criticalAlerts.filter(alert => alert.type === "critical").length,
      warningCount: criticalAlerts.filter(alert => alert.type === "warning").length
    })

  } catch (error) {
    console.error("Error fetching critical alerts:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch critical alerts" },
      { status: 500 }
    )
  }
}
