"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, Printer, Loader2 } from "lucide-react"

interface Location {
  id?: string
  _id?: string
  name: string
  code: string
  type: string
  description: string
  department: string
  parentLocation: string
  assetCount: number
  address: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface LocationsOverallReportProps {
  locations: Location[]
  isOpen: boolean
  onClose: () => void
}

export function LocationsOverallReport({ locations, isOpen, onClose }: LocationsOverallReportProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Calculate statistics
  const totalLocations = locations.length
  const activeLocations = locations.filter(loc => loc.status === 'active').length
  const inactiveLocations = locations.filter(loc => loc.status === 'inactive').length
  const totalAssets = locations.reduce((sum, loc) => sum + (loc.assetCount || 0), 0)
  const averageAssetsPerLocation = totalLocations > 0 ? Math.round(totalAssets / totalLocations * 100) / 100 : 0

  // Department analysis
  const departmentStats = locations.reduce((acc, loc) => {
    if (!acc[loc.department]) {
      acc[loc.department] = {
        count: 0,
        assets: 0,
        active: 0,
        inactive: 0
      }
    }
    acc[loc.department].count++
    acc[loc.department].assets += loc.assetCount || 0
    if (loc.status === 'active') {
      acc[loc.department].active++
    } else {
      acc[loc.department].inactive++
    }
    return acc
  }, {} as Record<string, { count: number; assets: number; active: number; inactive: number }>)

  // Type analysis
  const typeStats = locations.reduce((acc, loc) => {
    if (!acc[loc.type]) {
      acc[loc.type] = {
        count: 0,
        assets: 0
      }
    }
    acc[loc.type].count++
    acc[loc.type].assets += loc.assetCount || 0
    return acc
  }, {} as Record<string, { count: number; assets: number }>)

  // Top locations by asset count
  const topLocationsByAssets = [...locations]
    .sort((a, b) => (b.assetCount || 0) - (a.assetCount || 0))
    .slice(0, 10)

  // Locations with no assets
  const locationsWithNoAssets = locations.filter(loc => (loc.assetCount || 0) === 0)

  // Recent locations (created in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLocations = locations
    .filter(loc => new Date(loc.createdAt) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "inactive": return "secondary"
      default: return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active"
      case "inactive": return "Inactive"
      default: return status
    }
  }

  const handleGenerateReport = () => {
    setIsGeneratingReport(true)
    
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
    
    setIsGeneratingReport(false)
  }

  const generateReportHTML = () => {
    const currentDate = new Date()
    const currentDateStr = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const currentTimeStr = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Locations Comprehensive Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: white; 
            padding: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 20px; 
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 10px; 
          }
          .header .subtitle { 
            font-size: 16px; 
            color: #6b7280; 
            margin-bottom: 5px; 
          }
          .header .timestamp { 
            font-size: 14px; 
            color: #9ca3af; 
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .summary-card { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
          }
          .summary-card h3 { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 5px; 
          }
          .summary-card p { 
            color: #6b7280; 
            font-size: 14px; 
          }
          .section { 
            margin-bottom: 30px; 
          }
          .section h2 { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 5px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          }
          th { 
            background: #3b82f6; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-weight: 600; 
            font-size: 14px; 
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #e2e8f0; 
            font-size: 14px; 
          }
          tr:nth-child(even) { 
            background: #f8fafc; 
          }
          tr:hover { 
            background: #f1f5f9; 
          }
          .status-badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: 500; 
            text-transform: capitalize; 
          }
          .status-active { 
            background: #dcfce7; 
            color: #166534; 
          }
          .status-inactive { 
            background: #fee2e2; 
            color: #991b1b; 
          }
          .print-button { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 1000; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            font-weight: 600; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            transition: all 0.2s ease; 
            user-select: none; 
            border: 2px solid #1d4ed8; 
          }
          .print-button:hover { 
            background: #2563eb; 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(0,0,0,0.2); 
          }
          .close-button { 
            position: fixed; 
            top: 80px; 
            right: 20px; 
            z-index: 1000; 
            background: #6b7280; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            font-size: 12px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
            transition: all 0.2s ease; 
            user-select: none; 
            border: 1px solid #4b5563; 
          }
          .close-button:hover { 
            background: #4b5563; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.15); 
          }
          @media print { 
            .print-button, .close-button { 
              display: none; 
            } 
            body { 
              padding: 0; 
            } 
            .header { 
              border-bottom: 2px solid #3b82f6; 
            } 
          }
        </style>
      </head>
      <body>
        <div class="print-button" onclick="window.print()" title="Click to print or save as PDF">🖨️ Print Report</div>
        <div class="close-button" onclick="window.close()" title="Close this report window">❌ Close</div>
        
        <div class="header">
          <h1>LOCATIONS COMPREHENSIVE REPORT</h1>
          <div class="subtitle">Generated on ${currentDateStr}</div>
          <div class="timestamp">Time: ${currentTimeStr}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>${totalLocations}</h3>
            <p>Total Locations</p>
          </div>
          <div class="summary-card">
            <h3>${activeLocations}</h3>
            <p>Active Locations</p>
          </div>
          <div class="summary-card">
            <h3>${inactiveLocations}</h3>
            <p>Inactive Locations</p>
          </div>
          <div class="summary-card">
            <h3>${totalAssets}</h3>
            <p>Total Assets</p>
          </div>
          <div class="summary-card">
            <h3>${averageAssetsPerLocation}</h3>
            <p>Avg Assets/Location</p>
          </div>
        </div>

        <div class="section">
          <h2>📊 Executive Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Assets</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Locations</td>
                <td>${totalLocations}</td>
                <td>100%</td>
                <td>${totalAssets}</td>
              </tr>
              <tr>
                <td>Active Locations</td>
                <td>${activeLocations}</td>
                <td>${totalLocations > 0 ? ((activeLocations / totalLocations) * 100).toFixed(1) : 0}%</td>
                <td>${locations.filter(loc => loc.status === 'active').reduce((sum, loc) => sum + (loc.assetCount || 0), 0)}</td>
              </tr>
              <tr>
                <td>Inactive Locations</td>
                <td>${inactiveLocations}</td>
                <td>${totalLocations > 0 ? ((inactiveLocations / totalLocations) * 100).toFixed(1) : 0}%</td>
                <td>${locations.filter(loc => loc.status === 'inactive').reduce((sum, loc) => sum + (loc.assetCount || 0), 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏢 Department Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Locations</th>
                <th>Active</th>
                <th>Inactive</th>
                <th>Total Assets</th>
                <th>Avg Assets/Location</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(departmentStats).map(([department, stats]) => `
                <tr>
                  <td>${department}</td>
                  <td>${stats.count}</td>
                  <td>${stats.active}</td>
                  <td>${stats.inactive}</td>
                  <td>${stats.assets}</td>
                  <td>${stats.count > 0 ? (stats.assets / stats.count).toFixed(1) : 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏗️ Location Type Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Total Assets</th>
                <th>Avg Assets/Type</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(typeStats).map(([type, stats]) => `
                <tr>
                  <td>${type}</td>
                  <td>${stats.count}</td>
                  <td>${totalLocations > 0 ? ((stats.count / totalLocations) * 100).toFixed(1) : 0}%</td>
                  <td>${stats.assets}</td>
                  <td>${stats.count > 0 ? (stats.assets / stats.count).toFixed(1) : 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏆 Top Locations by Asset Count</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Location Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Department</th>
                <th>Asset Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${topLocationsByAssets.map((location, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${location.name}</td>
                  <td>${location.code}</td>
                  <td>${location.type}</td>
                  <td>${location.department}</td>
                  <td>${location.assetCount || 0}</td>
                  <td><span class="status-badge status-${location.status}">${getStatusLabel(location.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${locationsWithNoAssets.length > 0 ? `
        <div class="section">
          <h2>⚠️ Locations with No Assets</h2>
          <table>
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${locationsWithNoAssets.map(location => `
                <tr>
                  <td>${location.name}</td>
                  <td>${location.code}</td>
                  <td>${location.type}</td>
                  <td>${location.department}</td>
                  <td><span class="status-badge status-${location.status}">${getStatusLabel(location.status)}</span></td>
                  <td>${new Date(location.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${recentLocations.length > 0 ? `
        <div class="section">
          <h2>🆕 Recent Locations (Last 30 Days)</h2>
          <table>
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Department</th>
                <th>Asset Count</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${recentLocations.map(location => `
                <tr>
                  <td>${location.name}</td>
                  <td>${location.code}</td>
                  <td>${location.type}</td>
                  <td>${location.department}</td>
                  <td>${location.assetCount || 0}</td>
                  <td>${new Date(location.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2>📋 Complete Locations Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Department</th>
                <th>Parent Location</th>
                <th>Asset Count</th>
                <th>Status</th>
                <th>Address</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${locations.map(location => `
                <tr>
                  <td>${location.name}</td>
                  <td>${location.code}</td>
                  <td>${location.type}</td>
                  <td>${location.department}</td>
                  <td>${location.parentLocation || 'None'}</td>
                  <td>${location.assetCount || 0}</td>
                  <td><span class="status-badge status-${location.status}">${getStatusLabel(location.status)}</span></td>
                  <td>${location.address || 'N/A'}</td>
                  <td>${new Date(location.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <script>
          setTimeout(() => { 
            if (!window.closed) { 
              window.close() 
            } 
          }, 300000);
        </script>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Locations Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Locations</h3>
              <p className="text-2xl font-bold text-blue-600">{totalLocations}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Active Locations</h3>
              <p className="text-2xl font-bold text-green-600">{activeLocations}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Total Assets</h3>
              <p className="text-2xl font-bold text-purple-600">{totalAssets}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Avg Assets/Location</h3>
              <p className="text-2xl font-bold text-orange-600">{averageAssetsPerLocation}</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Department Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(departmentStats).slice(0, 5).map(([department, stats]) => (
                <div key={department} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{department}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{stats.count} locations</span>
                    <span>{stats.assets} assets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="flex-1"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
