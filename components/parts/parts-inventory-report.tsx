"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download, Package, FileText } from 'lucide-react'
import type { Part } from "@/types/part"

interface PartsInventoryReportProps {
  parts: Part[]
  onClose: () => void
}

export function PartsInventoryReport({ parts, onClose }: PartsInventoryReportProps) {
  const handleExportReport = () => {
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    // Calculate summary statistics
    const totalParts = parts.length
    const lowStockParts = parts.filter(part => part.quantity <= part.minStockLevel)
    const totalInventoryValue = parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0)
    const averageUnitPrice = totalParts > 0 ? parts.reduce((sum, part) => sum + part.unitPrice, 0) / totalParts : 0

    // Group by category
    const partsByCategory = parts.reduce((acc, part) => {
      if (!acc[part.category]) {
        acc[part.category] = []
      }
      acc[part.category].push(part)
      return acc
    }, {} as Record<string, Part[]>)

    // Group by department
    const partsByDepartment = parts.reduce((acc, part) => {
      if (!acc[part.department]) {
        acc[part.department] = []
      }
      acc[part.department].push(part)
      return acc
    }, {} as Record<string, Part[]>)

    // Category analysis
    const categoryStats = Object.entries(partsByCategory).map(([category, categoryParts]) => ({
      category,
      totalParts: categoryParts.length,
      totalValue: categoryParts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0),
      lowStockCount: categoryParts.filter(part => part.quantity <= part.minStockLevel).length,
      avgUnitPrice: categoryParts.reduce((sum, part) => sum + part.unitPrice, 0) / categoryParts.length
    })).sort((a, b) => b.totalValue - a.totalValue)

    // Department analysis
    const departmentStats = Object.entries(partsByDepartment).map(([department, deptParts]) => ({
      department,
      totalParts: deptParts.length,
      totalValue: deptParts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0),
      lowStockCount: deptParts.filter(part => part.quantity <= part.minStockLevel).length
    })).sort((a, b) => b.totalValue - a.totalValue)

    const getStockStatus = (part: Part) => {
      if (part.quantity <= part.minStockLevel) {
        return { status: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-50' }
      }
      return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50' }
    }
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parts Inventory Report</title>
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
          
          .report-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
          }
          
          .generated-info {
            font-size: 14px;
            color: #6b7280;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          
          .summary-card h3 {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
          }
          
          .summary-card .value {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .summary-card .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          
          .card-blue { border-color: #3b82f6; background: #eff6ff; }
          .card-blue .value { color: #1d4ed8; }
          .card-blue h3 { color: #1e40af; }
          
          .card-red { border-color: #ef4444; background: #fef2f2; }
          .card-red .value { color: #dc2626; }
          .card-red h3 { color: #991b1b; }
          
          .card-green { border-color: #10b981; background: #f0fdf4; }
          .card-green .value { color: #059669; }
          .card-green h3 { color: #047857; }
          
          .card-purple { border-color: #8b5cf6; background: #faf5ff; }
          .card-purple .value { color: #7c3aed; }
          .card-purple h3 { color: #6d28d9; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .financial-highlight {
            font-weight: bold;
            color: #059669;
          }
          
          .stock-warning {
            color: #dc2626;
            font-weight: bold;
          }
          
          .stock-normal {
            color: #059669;
            font-weight: bold;
          }
          
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          
          .print-btn, .close-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .print-btn {
            background: #2563eb;
            color: white;
          }
          
          .print-btn:hover {
            background: #1d4ed8;
          }
          
          .close-btn {
            background: #6b7280;
            color: white;
          }
          
          .close-btn:hover {
            background: #4b5563;
          }
          
          @media print {
            .print-controls {
              display: none;
            }
            
            body {
              padding: 0;
            }
            
            .section {
              page-break-inside: avoid;
            }
            
            table {
              font-size: 10px;
            }
            
            th, td {
              padding: 6px 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls">
          <button class="print-btn" onclick="window.print()">
            🖨️ Print Report
          </button>
          <button class="close-btn" onclick="window.close()">
            ❌ Close
          </button>
        </div>
        
        <div class="report-header">
          <h1 class="report-title">Parts Inventory Report</h1>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📊 Executive Summary
          </h2>
          <div class="summary-grid">
            <div class="summary-card card-blue">
              <h3>Total Parts</h3>
              <div class="value">${totalParts}</div>
              <div class="subtitle">Active inventory items</div>
            </div>
            <div class="summary-card card-red">
              <h3>Low Stock</h3>
              <div class="value">${lowStockParts.length}</div>
              <div class="subtitle">Parts requiring attention</div>
            </div>
            <div class="summary-card card-green">
              <h3>Total Value</h3>
              <div class="value">$${totalInventoryValue.toFixed(2)}</div>
              <div class="subtitle">Current stock value</div>
            </div>
            <div class="summary-card card-purple">
              <h3>Avg. Unit Price</h3>
              <div class="value">$${averageUnitPrice.toFixed(2)}</div>
              <div class="subtitle">Average cost per part</div>
            </div>
          </div>
        </div>
        
        ${lowStockParts.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            ⚠️ Critical Stock Issues (${lowStockParts.length} Parts)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Name</th>
                <th>Department</th>
                <th>Current Stock</th>
                <th>Min Level</th>
                <th>Shortage</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockParts.map(part => `
                <tr>
                  <td class="font-mono">${part.partNumber}</td>
                  <td>${part.name}</td>
                  <td>${part.department}</td>
                  <td class="stock-warning">${part.quantity}</td>
                  <td>${part.minStockLevel}</td>
                  <td class="stock-warning">
                    ${part.minStockLevel - part.quantity > 0 ? part.minStockLevel - part.quantity : 0}
                  </td>
                  <td>${part.supplier}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">
            📈 Category Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Parts</th>
                <th>Total Value</th>
                <th>Low Stock Count</th>
                <th>Avg Unit Price</th>
              </tr>
            </thead>
            <tbody>
              ${categoryStats.map(stat => `
                <tr>
                  <td class="font-semibold">${stat.category}</td>
                  <td>${stat.totalParts}</td>
                  <td class="financial-highlight">$${stat.totalValue.toFixed(2)}</td>
                  <td>
                    <span class="${stat.lowStockCount > 0 ? 'stock-warning' : 'stock-normal'}">
                      ${stat.lowStockCount}
                    </span>
                  </td>
                  <td>$${stat.avgUnitPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            🏢 Department Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Parts</th>
                <th>Total Value</th>
                <th>Low Stock Count</th>
                <th>Stock Health</th>
              </tr>
            </thead>
            <tbody>
              ${departmentStats.map(stat => {
                const healthPercentage = ((stat.totalParts - stat.lowStockCount) / stat.totalParts * 100)
                return `
                  <tr>
                    <td class="font-semibold">${stat.department}</td>
                    <td>${stat.totalParts}</td>
                    <td class="financial-highlight">$${stat.totalValue.toFixed(2)}</td>
                    <td>
                      <span class="${stat.lowStockCount > 0 ? 'stock-warning' : 'stock-normal'}">
                        ${stat.lowStockCount}
                      </span>
                    </td>
                    <td>
                      <span class="${healthPercentage >= 80 ? 'stock-normal' : healthPercentage >= 60 ? 'text-yellow-600' : 'stock-warning'}">
                        ${healthPercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📋 Complete Parts Inventory (${parts.length} Parts)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Material Code</th>
                <th>Category</th>
                <th>Department</th>
                <th>Current Stock</th>
                <th>Min Level</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${parts.map(part => {
                const stockStatus = getStockStatus(part)
                return `
                  <tr>
                    <td class="font-mono">${part.partNumber}</td>
                    <td class="font-medium">${part.name}</td>
                    <td class="font-mono">${part.sku}</td>
                    <td class="font-mono">${part.materialCode}</td>
                    <td>${part.category}</td>
                    <td>${part.department}</td>
                    <td class="text-center">
                      <span class="${part.quantity <= part.minStockLevel ? 'stock-warning' : 'stock-normal'}">
                        ${part.quantity}
                      </span>
                    </td>
                    <td class="text-center">${part.minStockLevel}</td>
                    <td class="text-right">$${part.unitPrice.toFixed(2)}</td>
                    <td class="text-right financial-highlight">
                      $${(part.quantity * part.unitPrice).toFixed(2)}
                    </td>
                    <td>
                      <span class="px-2 py-1 rounded text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}">
                        ${stockStatus.status}
                      </span>
                    </td>
                    <td>${part.supplier}</td>
                    <td>${part.location || 'N/A'}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="report-footer">
          <p>Report generated on ${currentDate} at ${currentTime}</p>
          <p style="margin-top: 4px;">
            This report contains ${parts.length} parts across ${Object.keys(partsByDepartment).length} departments and ${Object.keys(partsByCategory).length} categories
          </p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Parts Inventory Report
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a comprehensive inventory report for <strong>{parts.length} parts</strong> that opens in a new window with print functionality.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleExportReport}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
