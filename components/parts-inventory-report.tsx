"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PartInventory {
  id: string
  partName: string
  partNumber: string
  quantity: number
  unitCost: number
  supplier: string
  lastReplaced?: string
  nextMaintenanceDate?: string
  assetId: string
  assetName: string
  assetType: string
  location: string
  department: string
  isLowStock: boolean
}

interface PartsInventoryReportProps {
  filteredInventory: PartInventory[]
  totalParts: number
  lowStockParts: number
  totalValue: number
  uniqueDepartments: string[]
}

export function PartsInventoryReport({
  filteredInventory,
  totalParts,
  lowStockParts,
  totalValue,
  uniqueDepartments
}: PartsInventoryReportProps) {

  const generateCSVReport = () => {
    const headers = [
      'Part Name',
      'Part Number', 
      'Asset Name',
      'Asset Type',
      'Location',
      'Department',
      'Quantity',
      'Unit Cost',
      'Total Value',
      'Supplier',
      'Stock Status',
      'Last Replaced'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(part => [
        `"${part.partName}"`,
        `"${part.partNumber}"`,
        `"${part.assetName}"`,
        `"${part.assetType}"`,
        `"${part.location}"`,
        `"${part.department}"`,
        part.quantity,
        part.unitCost.toFixed(2),
        (part.quantity * part.unitCost).toFixed(2),
        `"${part.supplier}"`,
        part.isLowStock ? 'Low Stock' : 'In Stock',
        `"${part.lastReplaced || 'N/A'}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `parts-inventory-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDFReport = async () => {
    try {
      // Create a detailed HTML report that can be printed to PDF
      const reportWindow = window.open('', '_blank')
      if (!reportWindow) return

      const departmentStats = uniqueDepartments.map(dept => {
        const deptParts = filteredInventory.filter(part => part.department === dept)
        const deptValue = deptParts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0)
        const deptLowStock = deptParts.filter(part => part.isLowStock).length
        
        return {
          department: dept,
          partCount: deptParts.length,
          totalValue: deptValue,
          lowStockCount: deptLowStock
        }
      })

      const lowStockItems = filteredInventory.filter(part => part.isLowStock)

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Parts Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-title { font-weight: bold; color: #666; margin-bottom: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .low-stock { background-color: #ffebee; }
            .alert { color: #d32f2f; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Parts Inventory Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Report includes: ${filteredInventory.length} parts across ${uniqueDepartments.length} departments</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-title">Total Parts</div>
              <div class="stat-value">${totalParts}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Low Stock Parts</div>
              <div class="stat-value alert">${lowStockParts}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Total Inventory Value</div>
              <div class="stat-value">$${totalValue.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Average Part Value</div>
              <div class="stat-value">$${(totalValue / totalParts || 0).toFixed(2)}</div>
            </div>
          </div>

          ${lowStockItems.length > 0 ? `
          <div class="section">
            <div class="section-title alert">⚠️ Low Stock Alerts</div>
            <table>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Supplier</th>
              </tr>
              ${lowStockItems.map(part => `
                <tr class="low-stock">
                  <td>${part.partName}</td>
                  <td>${part.partNumber}</td>
                  <td>${part.assetName}</td>
                  <td class="alert">${part.quantity}</td>
                  <td>${part.supplier}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Department Breakdown</div>
            <table>
              <tr>
                <th>Department</th>
                <th>Parts Count</th>
                <th>Total Value</th>
                <th>Low Stock Count</th>
              </tr>
              ${departmentStats.map(dept => `
                <tr>
                  <td>${dept.department}</td>
                  <td>${dept.partCount}</td>
                  <td>$${dept.totalValue.toFixed(2)}</td>
                  <td class="${dept.lowStockCount > 0 ? 'alert' : ''}">${dept.lowStockCount}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">Complete Parts Inventory</div>
            <table>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Asset</th>
                <th>Location</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
              ${filteredInventory.map(part => `
                <tr class="${part.isLowStock ? 'low-stock' : ''}">
                  <td>${part.partName}</td>
                  <td>${part.partNumber}</td>
                  <td>${part.assetName}</td>
                  <td>${part.location}</td>
                  <td class="${part.isLowStock ? 'alert' : ''}">${part.quantity}</td>
                  <td>$${part.unitCost.toFixed(2)}</td>
                  <td>$${(part.quantity * part.unitCost).toFixed(2)}</td>
                  <td>${part.supplier}</td>
                  <td class="${part.isLowStock ? 'alert' : ''}">${part.isLowStock ? 'Low Stock' : 'In Stock'}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
        </html>
      `

      reportWindow.document.write(htmlContent)
      reportWindow.document.close()
      reportWindow.focus()
      
      // Auto-print dialog (user can save as PDF)
      setTimeout(() => {
        reportWindow.print()
      }, 250)
    } catch (error) {
      console.error('Error generating PDF report:', error)
      alert('Error generating PDF report. Please try again.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={generatePDFReport} className="gap-2">
          <FileText className="h-4 w-4" />
          PDF Report (Formatted)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateCSVReport} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          CSV Data Export
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 