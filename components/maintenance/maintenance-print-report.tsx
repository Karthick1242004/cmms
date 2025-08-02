"use client"

import type { MaintenanceSchedule, MaintenanceRecord, MaintenanceStats } from "@/types/maintenance"

interface MaintenancePrintReportProps {
  schedules: MaintenanceSchedule[]
  records: MaintenanceRecord[]
  stats: MaintenanceStats | null
}

export function MaintenancePrintReport({ 
  schedules, 
  records, 
  stats 
}: MaintenancePrintReportProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getOverdueSchedules = () => {
    const today = new Date()
    return schedules.filter(schedule => new Date(schedule.nextDueDate) < today)
  }

  const getUpcomingSchedules = () => {
    const today = new Date()
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return schedules.filter(schedule => {
      const dueDate = new Date(schedule.nextDueDate)
      return dueDate >= today && dueDate <= oneWeekFromNow
    })
  }

  const getRecentRecords = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return records
      .filter(record => new Date(record.completedDate) >= oneMonthAgo)
      .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      .slice(0, 10)
  }

  const getDepartmentStats = () => {
    const departmentCounts: Record<string, { total: number; overdue: number; completed: number }> = {}
    
    schedules.forEach(schedule => {
      if (!departmentCounts[schedule.department]) {
        departmentCounts[schedule.department] = { total: 0, overdue: 0, completed: 0 }
      }
      departmentCounts[schedule.department].total++
      
      if (schedule.status === 'overdue') {
        departmentCounts[schedule.department].overdue++
      } else if (schedule.status === 'completed') {
        departmentCounts[schedule.department].completed++
      }
    })
    
    return Object.entries(departmentCounts).map(([department, stats]) => ({
      department,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
  }

  const overdueSchedules = getOverdueSchedules()
  const upcomingSchedules = getUpcomingSchedules()
  const recentRecords = getRecentRecords()
  const departmentStats = getDepartmentStats()

  return (
    <div className="print:text-xs space-y-4">
      {/* Report Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">MAINTENANCE COMPREHENSIVE REPORT</h1>
        <p className="mt-2 text-sm">Generated on {formatDateTime(new Date().toISOString())}</p>
        <p className="text-sm">Total Schedules: {schedules.length} | Overdue: {overdueSchedules.length} | Due This Week: {upcomingSchedules.length} | Completed This Month: {stats?.completedThisMonth || 0}</p>
      </div>

      {/* Executive Summary Table */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-400">EXECUTIVE SUMMARY</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Metric</th>
              <th className="border border-black p-2 text-center">Count</th>
              <th className="border border-black p-2 text-center">Percentage</th>
              <th className="border border-black p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">Total Maintenance Schedules</td>
              <td className="border border-black p-2 text-center font-bold">{schedules.length}</td>
              <td className="border border-black p-2 text-center">100%</td>
              <td className="border border-black p-2">System Total</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Active Schedules</td>
              <td className="border border-black p-2 text-center">{schedules.filter(s => s.status === 'active').length}</td>
              <td className="border border-black p-2 text-center">{schedules.length > 0 ? Math.round((schedules.filter(s => s.status === 'active').length / schedules.length) * 100) : 0}%</td>
              <td className="border border-black p-2 text-green-700">Operational</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Overdue Maintenance</td>
              <td className="border border-black p-2 text-center font-bold text-red-700">{overdueSchedules.length}</td>
              <td className="border border-black p-2 text-center text-red-700">{schedules.length > 0 ? Math.round((overdueSchedules.length / schedules.length) * 100) : 0}%</td>
              <td className="border border-black p-2 text-red-700">Critical Attention Required</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Due This Week</td>
              <td className="border border-black p-2 text-center font-bold text-orange-700">{upcomingSchedules.length}</td>
              <td className="border border-black p-2 text-center text-orange-700">{schedules.length > 0 ? Math.round((upcomingSchedules.length / schedules.length) * 100) : 0}%</td>
              <td className="border border-black p-2 text-orange-700">Immediate Planning Required</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Completed This Month</td>
              <td className="border border-black p-2 text-center font-bold text-green-700">{stats?.completedThisMonth || 0}</td>
              <td className="border border-black p-2 text-center text-green-700">-</td>
              <td className="border border-black p-2 text-green-700">Performance Metric</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Critical Issues Table */}
      {overdueSchedules.length > 0 && (
        <div className="mb-6 print:break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-400 text-red-700">🚨 CRITICAL ISSUES - OVERDUE MAINTENANCE ({overdueSchedules.length})</h2>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-black p-2 text-left">Asset Name</th>
                <th className="border border-black p-2 text-left">Maintenance Title</th>
                <th className="border border-black p-2 text-left">Location</th>
                <th className="border border-black p-2 text-left">Department</th>
                <th className="border border-black p-2 text-center">Priority</th>
                <th className="border border-black p-2 text-center">Due Date</th>
                <th className="border border-black p-2 text-center">Days Overdue</th>
                <th className="border border-black p-2 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {overdueSchedules.map((schedule) => {
                const daysOverdue = Math.abs(getDaysUntilDue(schedule.nextDueDate))
                return (
                  <tr key={schedule.id} className="bg-red-25">
                    <td className="border border-black p-2 font-medium">{schedule.assetName}</td>
                    <td className="border border-black p-2">{schedule.title}</td>
                    <td className="border border-black p-2">{schedule.location}</td>
                    <td className="border border-black p-2">{schedule.department}</td>
                    <td className="border border-black p-2 text-center">
                      <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                        schedule.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        schedule.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        schedule.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {schedule.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="border border-black p-2 text-center text-red-700 font-bold">{formatDate(schedule.nextDueDate)}</td>
                    <td className="border border-black p-2 text-center text-red-700 font-bold">{daysOverdue}</td>
                    <td className="border border-black p-2">{schedule.assignedTechnician || 'Unassigned'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upcoming Maintenance Table */}
      {upcomingSchedules.length > 0 && (
        <div className="mb-6 print:break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-400 text-orange-700">📅 UPCOMING MAINTENANCE - DUE THIS WEEK ({upcomingSchedules.length})</h2>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-orange-50">
                <th className="border border-black p-2 text-left">Asset Name</th>
                <th className="border border-black p-2 text-left">Maintenance Title</th>
                <th className="border border-black p-2 text-left">Location</th>
                <th className="border border-black p-2 text-left">Department</th>
                <th className="border border-black p-2 text-center">Priority</th>
                <th className="border border-black p-2 text-center">Due Date</th>
                <th className="border border-black p-2 text-center">Days Remaining</th>
                <th className="border border-black p-2 text-center">Est. Duration</th>
                <th className="border border-black p-2 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSchedules.map((schedule) => {
                const daysRemaining = getDaysUntilDue(schedule.nextDueDate)
                return (
                  <tr key={schedule.id}>
                    <td className="border border-black p-2 font-medium">{schedule.assetName}</td>
                    <td className="border border-black p-2">{schedule.title}</td>
                    <td className="border border-black p-2">{schedule.location}</td>
                    <td className="border border-black p-2">{schedule.department}</td>
                    <td className="border border-black p-2 text-center">
                      <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                        schedule.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        schedule.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        schedule.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {schedule.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="border border-black p-2 text-center text-orange-700 font-bold">{formatDate(schedule.nextDueDate)}</td>
                    <td className="border border-black p-2 text-center text-orange-700 font-bold">{daysRemaining}</td>
                    <td className="border border-black p-2 text-center">{schedule.estimatedDuration}h</td>
                    <td className="border border-black p-2">{schedule.assignedTechnician || 'Unassigned'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All Maintenance Schedules Table */}
      <div className="mb-6 print:break-before-page">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-400">📋 ALL MAINTENANCE SCHEDULES ({schedules.length})</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Asset Name</th>
              <th className="border border-black p-2 text-left">Maintenance Title</th>
              <th className="border border-black p-2 text-left">Location</th>
              <th className="border border-black p-2 text-left">Department</th>
              <th className="border border-black p-2 text-center">Status</th>
              <th className="border border-black p-2 text-center">Priority</th>
              <th className="border border-black p-2 text-center">Frequency</th>
              <th className="border border-black p-2 text-center">Next Due</th>
              <th className="border border-black p-2 text-center">Duration</th>
              <th className="border border-black p-2 text-left">Assigned To</th>
              <th className="border border-black p-2 text-center">Parts Count</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className={`${
                schedule.status === 'overdue' ? 'bg-red-50' :
                getDaysUntilDue(schedule.nextDueDate) <= 7 && getDaysUntilDue(schedule.nextDueDate) >= 0 ? 'bg-orange-50' :
                ''
              }`}>
                <td className="border border-black p-2 font-medium">{schedule.assetName}</td>
                <td className="border border-black p-2">{schedule.title}</td>
                <td className="border border-black p-2">{schedule.location}</td>
                <td className="border border-black p-2">{schedule.department}</td>
                <td className="border border-black p-2 text-center">
                  <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                    schedule.status === 'active' ? 'bg-green-200 text-green-800' :
                    schedule.status === 'overdue' ? 'bg-red-200 text-red-800' :
                    schedule.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {schedule.status.toUpperCase()}
                  </span>
                </td>
                <td className="border border-black p-2 text-center">
                  <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                    schedule.priority === 'critical' ? 'bg-red-200 text-red-800' :
                    schedule.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                    schedule.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {schedule.priority.toUpperCase()}
                  </span>
                </td>
                <td className="border border-black p-2 text-center capitalize">
                  {schedule.frequency === "custom" 
                    ? `Every ${schedule.customFrequencyDays} days`
                    : schedule.frequency
                  }
                </td>
                <td className="border border-black p-2 text-center">{formatDate(schedule.nextDueDate)}</td>
                <td className="border border-black p-2 text-center">{schedule.estimatedDuration}h</td>
                <td className="border border-black p-2">{schedule.assignedTechnician || 'Unassigned'}</td>
                <td className="border border-black p-2 text-center">{schedule.parts.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Maintenance Records */}
      {recentRecords.length > 0 && (
        <div className="mb-6 print:break-before-page">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-400">⚡ RECENT MAINTENANCE RECORDS - LAST 30 DAYS ({recentRecords.length})</h2>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-black p-2 text-left">Asset Name</th>
                <th className="border border-black p-2 text-left">Department</th>
                <th className="border border-black p-2 text-center">Completed Date</th>
                <th className="border border-black p-2 text-left">Technician</th>
                <th className="border border-black p-2 text-center">Status</th>
                <th className="border border-black p-2 text-center">Condition</th>
                <th className="border border-black p-2 text-center">Duration</th>
                <th className="border border-black p-2 text-center">Verified</th>
                <th className="border border-black p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="border border-black p-2 font-medium">{record.assetName}</td>
                  <td className="border border-black p-2">{record.department}</td>
                  <td className="border border-black p-2 text-center">{formatDate(record.completedDate)}</td>
                  <td className="border border-black p-2">{record.technician}</td>
                  <td className="border border-black p-2 text-center">
                    <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                      record.status === 'completed' ? 'bg-green-200 text-green-800' :
                      record.status === 'failed' ? 'bg-red-200 text-red-800' :
                      record.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {record.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="border border-black p-2 text-center">
                    <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                      record.overallCondition === 'excellent' ? 'bg-green-200 text-green-800' :
                      record.overallCondition === 'good' ? 'bg-blue-200 text-blue-800' :
                      record.overallCondition === 'fair' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {record.overallCondition.toUpperCase()}
                    </span>
                  </td>
                  <td className="border border-black p-2 text-center">{record.actualDuration}h</td>
                  <td className="border border-black p-2 text-center">
                    {record.adminVerified ? '✅ Yes' : '❌ No'}
                  </td>
                  <td className="border border-black p-2 text-xs">{record.notes || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Department Performance Analysis */}
      <div className="mb-6 print:break-before-page">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-400">🏢 DEPARTMENT PERFORMANCE ANALYSIS</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-purple-50">
              <th className="border border-black p-2 text-left">Department</th>
              <th className="border border-black p-2 text-center">Total Schedules</th>
              <th className="border border-black p-2 text-center">Completed</th>
              <th className="border border-black p-2 text-center">Overdue</th>
              <th className="border border-black p-2 text-center">Active</th>
              <th className="border border-black p-2 text-center">Completion Rate</th>
              <th className="border border-black p-2 text-left">Performance Rating</th>
              <th className="border border-black p-2 text-left">Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {departmentStats.map((dept) => {
              const activeCount = dept.total - dept.completed - dept.overdue
              const performanceRating = 
                dept.completionRate >= 90 ? 'Excellent' :
                dept.completionRate >= 75 ? 'Good' :
                dept.completionRate >= 60 ? 'Fair' : 'Needs Improvement'
              const recommendations = 
                dept.overdue > 0 ? 'Address overdue items immediately' :
                dept.completionRate < 75 ? 'Improve scheduling and resource allocation' :
                'Maintain current performance standards'
              
              return (
                <tr key={dept.department}>
                  <td className="border border-black p-2 font-medium">{dept.department}</td>
                  <td className="border border-black p-2 text-center font-bold">{dept.total}</td>
                  <td className="border border-black p-2 text-center text-green-700 font-bold">{dept.completed}</td>
                  <td className="border border-black p-2 text-center text-red-700 font-bold">{dept.overdue}</td>
                  <td className="border border-black p-2 text-center text-blue-700 font-bold">{activeCount}</td>
                  <td className="border border-black p-2 text-center">
                    <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                      dept.completionRate >= 90 ? 'bg-green-200 text-green-800' :
                      dept.completionRate >= 75 ? 'bg-blue-200 text-blue-800' :
                      dept.completionRate >= 60 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {dept.completionRate}%
                    </span>
                  </td>
                  <td className="border border-black p-2">
                    <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                      performanceRating === 'Excellent' ? 'bg-green-200 text-green-800' :
                      performanceRating === 'Good' ? 'bg-blue-200 text-blue-800' :
                      performanceRating === 'Fair' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {performanceRating}
                    </span>
                  </td>
                  <td className="border border-black p-2 text-xs">{recommendations}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Report Footer */}
      <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs">
        <p><strong>END OF MAINTENANCE REPORT</strong></p>
        <p>Report Generated: {formatDateTime(new Date().toISOString())} | Total Pages: Multiple | Classification: Internal Use Only</p>
        <p>This report contains confidential maintenance data. Please handle according to company data security policies.</p>
      </div>
    </div>
  )
}