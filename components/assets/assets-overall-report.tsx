"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Package,
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  BarChart3,
  Building,
  TrendingUp,
  X,
  Printer,
  Download,
  Wrench
} from "lucide-react"
import type { Asset } from "@/types/asset"

interface AssetsOverallReportProps {
  assets: Asset[]
  isOpen: boolean
  onClose: () => void
}

export function AssetsOverallReport({ assets, isOpen, onClose }: AssetsOverallReportProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Calculate summary statistics
  const totalAssets = assets.length
  const maintenanceAssets = assets.filter(asset => asset.status === "maintenance")
  const outOfServiceAssets = assets.filter(asset => asset.status === "out-of-service")
  const operationalAssets = assets.filter(asset => asset.status === "operational")
  const availableAssets = assets.filter(asset => asset.status === "available")
  const totalValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)

  // Group by category
  const assetsByCategory = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = []
    }
    acc[asset.type].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  // Group by department
  const assetsByDepartment = assets.reduce((acc, asset) => {
    if (!acc[asset.department]) {
      acc[asset.department] = []
    }
    acc[asset.department].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  // Group by condition
  const assetsByCondition = assets.reduce((acc, asset) => {
    const condition = asset.condition || 'unknown'
    if (!acc[condition]) {
      acc[condition] = []
    }
    acc[condition].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  // Category analysis
  const categoryStats = Object.entries(assetsByCategory).map(([category, categoryAssets]) => ({
    category,
    totalAssets: categoryAssets.length,
    totalValue: categoryAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
    maintenanceCount: categoryAssets.filter(asset => asset.status === "maintenance").length,
    outOfServiceCount: categoryAssets.filter(asset => asset.status === "out-of-service").length,
    avgValue: categoryAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0) / categoryAssets.length
  })).sort((a, b) => b.totalValue - a.totalValue)

  // Department analysis
  const departmentStats = Object.entries(assetsByDepartment).map(([department, deptAssets]) => ({
    department,
    totalAssets: deptAssets.length,
    totalValue: deptAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
    operationalCount: deptAssets.filter(asset => asset.status === "operational").length,
    maintenanceCount: deptAssets.filter(asset => asset.status === "maintenance").length,
    healthPercentage: (deptAssets.filter(asset => asset.status === "operational").length / deptAssets.length) * 100
  })).sort((a, b) => b.totalValue - a.totalValue)

  // Condition analysis
  const conditionStats = Object.entries(assetsByCondition).map(([condition, conditionAssets]) => ({
    condition,
    count: conditionAssets.length,
    percentage: (conditionAssets.length / totalAssets) * 100,
    totalValue: conditionAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
  })).sort((a, b) => b.count - a.count)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCriticalAssets = () => {
    return [...maintenanceAssets, ...outOfServiceAssets]
  }

  const getRecentPurchases = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return assets
      .filter(asset => asset.purchaseDate && new Date(asset.purchaseDate) >= oneMonthAgo)
      .sort((a, b) => new Date(b.purchaseDate || '').getTime() - new Date(a.purchaseDate || '').getTime())
      .slice(0, 10)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "default"
      case "maintenance": return "secondary"
      case "out-of-service": return "destructive"
      case "available": return "outline"
      default: return "default"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
      case "new": return "default"
      case "good": return "secondary"
      case "fair": return "outline"
      case "poor": return "destructive"
      default: return "secondary"
    }
  }

  const handlePrint = () => {
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const handleDownloadReport = async () => {
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
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const currentTime = new Date().toLocaleTimeString('en-US', {
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
        <title>Assets Comprehensive Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
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
          
          .status-operational {
            background: #dcfce7;
            color: #166534;
          }
          
          .status-maintenance {
            background: #fef3c7;
            color: #92400e;
          }
          
          .status-out-of-service {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .status-available {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .condition-excellent, .condition-new {
            background: #dcfce7;
            color: #166534;
          }
          
          .condition-good {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .condition-fair {
            background: #fef3c7;
            color: #92400e;
          }
          
          .condition-poor {
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
        <div class="print-button" onclick="window.print()" title="Click to print or save as PDF">
          🖨️ Print Report
        </div>
        
        <div class="close-button" onclick="window.close()" title="Close this report window">
          ❌ Close
        </div>
        
        <div class="header">
          <h1>ASSETS COMPREHENSIVE REPORT</h1>
          <div class="subtitle">Generated on ${currentDate}</div>
          <div class="timestamp">Time: ${currentTime}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>${totalAssets}</h3>
            <p>Total Assets</p>
          </div>
          <div class="summary-card">
            <h3>${operationalAssets.length}</h3>
            <p>Operational</p>
          </div>
          <div class="summary-card">
            <h3>${maintenanceAssets.length}</h3>
            <p>Maintenance</p>
          </div>
          <div class="summary-card">
            <h3>${outOfServiceAssets.length}</h3>
            <p>Out of Service</p>
          </div>
          <div class="summary-card">
            <h3>$${totalValue.toLocaleString()}</h3>
            <p>Total Value</p>
          </div>
        </div>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Assets</td>
                <td>${totalAssets}</td>
                <td>100%</td>
                <td>$${totalValue.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Operational</td>
                <td>${operationalAssets.length}</td>
                <td>${totalAssets > 0 ? ((operationalAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td>
                <td>$${operationalAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Under Maintenance</td>
                <td>${maintenanceAssets.length}</td>
                <td>${totalAssets > 0 ? ((maintenanceAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td>
                <td>$${maintenanceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Out of Service</td>
                <td>${outOfServiceAssets.length}</td>
                <td>${totalAssets > 0 ? ((outOfServiceAssets.length / totalAssets) * 100).toFixed(1) : 0}%</td>
                <td>$${outOfServiceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Category Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Assets</th>
                <th>Total Value</th>
                <th>Maintenance</th>
                <th>Out of Service</th>
                <th>Health %</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(assetsByCategory).map(([category, categoryAssets]) => {
                const categoryMaintenance = categoryAssets.filter(asset => asset.status === "maintenance").length
                const categoryOutOfService = categoryAssets.filter(asset => asset.status === "out-of-service").length
                const categoryValue = categoryAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
                const healthPercentage = categoryAssets.length > 0 ? 
                  (((categoryAssets.length - categoryMaintenance - categoryOutOfService) / categoryAssets.length) * 100).toFixed(1) : 0
                
                return `
                  <tr>
                    <td>${category}</td>
                    <td>${categoryAssets.length}</td>
                    <td>$${categoryValue.toLocaleString()}</td>
                    <td>${categoryMaintenance}</td>
                    <td>${categoryOutOfService}</td>
                    <td>${healthPercentage}%</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Department Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Assets</th>
                <th>Total Value</th>
                <th>Operational</th>
                <th>Maintenance</th>
                <th>Health %</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(assetsByDepartment).map(([department, departmentAssets]) => {
                const departmentOperational = departmentAssets.filter(asset => asset.status === "operational").length
                const departmentMaintenance = departmentAssets.filter(asset => asset.status === "maintenance").length
                const departmentValue = departmentAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
                const healthPercentage = departmentAssets.length > 0 ? 
                  ((departmentOperational / departmentAssets.length) * 100).toFixed(1) : 0
                
                return `
                  <tr>
                    <td>${department}</td>
                    <td>${departmentAssets.length}</td>
                    <td>$${departmentValue.toLocaleString()}</td>
                    <td>${departmentOperational}</td>
                    <td>${departmentMaintenance}</td>
                    <td>${healthPercentage}%</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Complete Assets Inventory</h2>
          <table>
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Asset Tag</th>
                <th>Type</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map(asset => `
                <tr>
                  <td>${asset.name}</td>
                  <td>${asset.assetTag || 'N/A'}</td>
                  <td>${asset.type}</td>
                  <td>${asset.department}</td>
                  <td>${asset.location}</td>
                  <td><span class="status-badge status-${asset.status.replace('-', '-')}">${asset.status}</span></td>
                  <td><span class="status-badge condition-${asset.condition}">${asset.condition}</span></td>
                  <td>$${(asset.purchasePrice || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <script>
          // Auto-close window after 5 minutes of inactivity
          setTimeout(() => {
            if (!window.closed) {
              window.close()
            }
          }, 300000) // 5 minutes
        </script>
      </body>
      </html>
    `
  }

  const criticalAssets = getCriticalAssets()
  const recentPurchases = getRecentPurchases()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Assets Report</h2>
                <p className="text-sm text-muted-foreground">Overall assets status and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Action Buttons - Hidden when printing */}
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint} size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadReport}
                  disabled={isGeneratingReport}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingReport ? "Generating..." : "Download PDF"}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="print:hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 print:hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="summary" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{totalAssets}</p>
                        <p className="text-xs text-muted-foreground">Total Assets</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{operationalAssets.length}</p>
                        <p className="text-xs text-muted-foreground">Operational</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{maintenanceAssets.length}</p>
                        <p className="text-xs text-muted-foreground">Maintenance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">{outOfServiceAssets.length}</p>
                        <p className="text-xs text-muted-foreground">Out of Service</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-purple-600">${totalValue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Issues ({criticalAssets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {criticalAssets.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No critical asset issues</p>
                  ) : (
                    <div className="space-y-2">
                      {criticalAssets.slice(0, 5).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">{asset.assetTag || asset.id} • {asset.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(asset.status)} className="capitalize">
                              {asset.status.replace("-", " ")}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {asset.department}
                            </p>
                          </div>
                        </div>
                      ))}
                      {criticalAssets.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground">
                          ...and {criticalAssets.length - 5} more critical assets
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Purchases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Purchases ({recentPurchases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPurchases.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No recent purchases in the last month</p>
                  ) : (
                    <div className="space-y-2">
                      {recentPurchases.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">{asset.assetTag || asset.id} • {asset.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getConditionColor(asset.condition || 'unknown')} className="capitalize">
                              {asset.condition || 'Unknown'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {asset.purchaseDate ? formatDate(asset.purchaseDate) : 'Date unknown'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    All Assets ({assets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.assetTag || asset.id} • {asset.location} • {asset.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(asset.status)} className="capitalize">
                            {asset.status.replace("-", " ")}
                          </Badge>
                          <Badge variant={getConditionColor(asset.condition || 'unknown')} className="capitalize">
                            {asset.condition || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-right text-sm">
                          <p>${(asset.purchasePrice || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Category Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryStats.map((category) => (
                      <div key={category.category} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{category.category}</h3>
                          <Badge variant="outline">${category.totalValue.toLocaleString()}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">{category.totalAssets}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Maintenance</p>
                            <p className="font-medium text-yellow-600">{category.maintenanceCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Out of Service</p>
                            <p className="font-medium text-red-600">{category.outOfServiceCount}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${((category.totalAssets - category.maintenanceCount - category.outOfServiceCount) / category.totalAssets) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Department Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.department} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{dept.department}</h3>
                          <Badge variant="outline">{dept.healthPercentage.toFixed(1)}% healthy</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">{dept.totalAssets}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Operational</p>
                            <p className="font-medium text-green-600">{dept.operationalCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Issues</p>
                            <p className="font-medium text-red-600">{dept.maintenanceCount}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${dept.healthPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        {/* Print View - Comprehensive table-based report */}
        <div ref={reportRef} className="hidden print:block">
          <div className="print:text-xs space-y-4">
            {/* Report Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase">ASSETS COMPREHENSIVE REPORT</h1>
              <p className="mt-2 text-sm">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p className="text-sm">Total Assets: {totalAssets} | Operational: {operationalAssets.length} | Maintenance: {maintenanceAssets.length} | Out of Service: {outOfServiceAssets.length} | Total Value: ${totalValue.toLocaleString()}</p>
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
                    <th className="border border-black p-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold">Total Assets</td>
                    <td className="border border-black p-2 text-center">{totalAssets}</td>
                    <td className="border border-black p-2 text-center">100%</td>
                    <td className="border border-black p-2">${totalValue.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Operational</td>
                    <td className="border border-black p-2 text-center">{operationalAssets.length}</td>
                    <td className="border border-black p-2 text-center">{((operationalAssets.length / totalAssets) * 100).toFixed(1)}%</td>
                    <td className="border border-black p-2">${operationalAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Under Maintenance</td>
                    <td className="border border-black p-2 text-center">{maintenanceAssets.length}</td>
                    <td className="border border-black p-2 text-center">{((maintenanceAssets.length / totalAssets) * 100).toFixed(1)}%</td>
                    <td className="border border-black p-2">${maintenanceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Out of Service</td>
                    <td className="border border-black p-2 text-center">{outOfServiceAssets.length}</td>
                    <td className="border border-black p-2 text-center">{((outOfServiceAssets.length / totalAssets) * 100).toFixed(1)}%</td>
                    <td className="border border-black p-2">${outOfServiceAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Category Analysis Table */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-400">CATEGORY ANALYSIS</h2>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left">Category</th>
                    <th className="border border-black p-2 text-center">Total Assets</th>
                    <th className="border border-black p-2 text-center">Total Value</th>
                    <th className="border border-black p-2 text-center">Maintenance</th>
                    <th className="border border-black p-2 text-center">Out of Service</th>
                    <th className="border border-black p-2 text-center">Health %</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryStats.map(stat => {
                    const healthPercentage = ((stat.totalAssets - stat.maintenanceCount - stat.outOfServiceCount) / stat.totalAssets) * 100
                    return (
                      <tr key={stat.category}>
                        <td className="border border-black p-2 font-bold">{stat.category}</td>
                        <td className="border border-black p-2 text-center">{stat.totalAssets}</td>
                        <td className="border border-black p-2 text-center">${stat.totalValue.toLocaleString()}</td>
                        <td className="border border-black p-2 text-center">{stat.maintenanceCount}</td>
                        <td className="border border-black p-2 text-center">{stat.outOfServiceCount}</td>
                        <td className="border border-black p-2 text-center">{healthPercentage.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Department Analysis Table */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-400">DEPARTMENT ANALYSIS</h2>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left">Department</th>
                    <th className="border border-black p-2 text-center">Total Assets</th>
                    <th className="border border-black p-2 text-center">Total Value</th>
                    <th className="border border-black p-2 text-center">Operational</th>
                    <th className="border border-black p-2 text-center">Maintenance</th>
                    <th className="border border-black p-2 text-center">Health %</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.map(stat => (
                    <tr key={stat.department}>
                      <td className="border border-black p-2 font-bold">{stat.department}</td>
                      <td className="border border-black p-2 text-center">{stat.totalAssets}</td>
                      <td className="border border-black p-2 text-center">${stat.totalValue.toLocaleString()}</td>
                      <td className="border border-black p-2 text-center">{stat.operationalCount}</td>
                      <td className="border border-black p-2 text-center">{stat.maintenanceCount}</td>
                      <td className="border border-black p-2 text-center">{stat.healthPercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Complete Assets Inventory */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-400">COMPLETE ASSETS INVENTORY ({assets.length} Assets)</h2>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-left">Asset Name</th>
                    <th className="border border-black p-1 text-left">Asset Tag</th>
                    <th className="border border-black p-1 text-left">Type</th>
                    <th className="border border-black p-1 text-left">Department</th>
                    <th className="border border-black p-1 text-left">Location</th>
                    <th className="border border-black p-1 text-left">Status</th>
                    <th className="border border-black p-1 text-left">Condition</th>
                    <th className="border border-black p-1 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.id}>
                      <td className="border border-black p-1">{asset.name}</td>
                      <td className="border border-black p-1">{asset.assetTag || asset.id}</td>
                      <td className="border border-black p-1">{asset.type}</td>
                      <td className="border border-black p-1">{asset.department}</td>
                      <td className="border border-black p-1">{asset.location}</td>
                      <td className="border border-black p-1">{asset.status.replace('-', ' ')}</td>
                      <td className="border border-black p-1">{asset.condition || 'Unknown'}</td>
                      <td className="border border-black p-1">${(asset.purchasePrice || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  )
}