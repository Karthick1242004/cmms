"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Package, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react'
import type { Part } from "@/types/part"

interface PartsInventoryReportProps {
  parts: Part[]
  onClose: () => void
}

export function PartsInventoryReport({ parts, onClose }: PartsInventoryReportProps) {
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

  const handlePrint = () => {
    window.print()
  }

  const getStockStatus = (part: Part) => {
    if (part.quantity <= part.minStockLevel) {
      return { status: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:relative print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Header - No Print */}
        <div className="flex items-center justify-between p-6 border-b print:hidden">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parts Inventory Report</h2>
              <p className="text-sm text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] print:overflow-visible print:max-h-none print-content">
          <div className="p-8 space-y-8 print:p-4">
            
            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Parts Inventory Report</h1>
              <p className="text-lg text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Executive Summary */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Executive Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Total Parts</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalParts}</p>
                  <p className="text-sm text-blue-700">Active inventory items</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Low Stock</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{lowStockParts.length}</p>
                  <p className="text-sm text-red-700">Parts requiring attention</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Total Value</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${totalInventoryValue.toFixed(2)}</p>
                  <p className="text-sm text-green-700">Current stock value</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Avg. Unit Price</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">${averageUnitPrice.toFixed(2)}</p>
                  <p className="text-sm text-purple-700">Average cost per part</p>
                </div>
              </div>
            </div>

            {/* Critical Stock Issues */}
            {lowStockParts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Critical Stock Issues ({lowStockParts.length} Parts)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Part Number</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Department</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Current Stock</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Min Level</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Shortage</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Supplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockParts.map(part => (
                        <tr key={part.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{part.partNumber}</td>
                          <td className="border border-gray-300 px-4 py-2">{part.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{part.department}</td>
                          <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">{part.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2">{part.minStockLevel}</td>
                          <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                            {part.minStockLevel - part.quantity > 0 ? part.minStockLevel - part.quantity : 0}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{part.supplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Category Analysis */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Category Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Category</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Parts</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Low Stock Count</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Avg Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryStats.map(stat => (
                      <tr key={stat.category} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{stat.category}</td>
                        <td className="border border-gray-300 px-4 py-2">{stat.totalParts}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">${stat.totalValue.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={stat.lowStockCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {stat.lowStockCount}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">${stat.avgUnitPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Analysis */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Department Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Department</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Parts</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Low Stock Count</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Stock Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map(stat => {
                      const healthPercentage = ((stat.totalParts - stat.lowStockCount) / stat.totalParts * 100)
                      return (
                        <tr key={stat.department} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-semibold">{stat.department}</td>
                          <td className="border border-gray-300 px-4 py-2">{stat.totalParts}</td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">${stat.totalValue.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={stat.lowStockCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {stat.lowStockCount}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={healthPercentage >= 80 ? 'text-green-600' : healthPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                              {healthPercentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Parts Inventory */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Complete Parts Inventory ({parts.length} Parts)</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm print-table">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Part Number</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Name</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">SKU</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Material Code</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Category</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Department</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Current Stock</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Min Level</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Unit Price</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Total Value</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Status</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Supplier</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map(part => {
                      const stockStatus = getStockStatus(part)
                      return (
                        <tr key={part.id} className="hover:bg-gray-50 print-row">
                          <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{part.partNumber}</td>
                          <td className="border border-gray-300 px-2 py-1 font-medium text-xs">{part.name}</td>
                          <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{part.sku}</td>
                          <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{part.materialCode}</td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">{part.category}</td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">{part.department}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                            <span className={part.quantity <= part.minStockLevel ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                              {part.quantity}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-xs">{part.minStockLevel}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right text-xs">${part.unitPrice.toFixed(2)}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">
                            ${(part.quantity * part.unitPrice).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">
                            <span className={`px-1 py-0 rounded text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">{part.supplier}</td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">{part.location || 'N/A'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-gray-600">
              <p className="text-sm">
                Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
              <p className="text-xs mt-1">
                This report contains {parts.length} parts across {Object.keys(partsByDepartment).length} departments and {Object.keys(partsByCategory).length} categories
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Hide everything first */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the print content */
          .print-content,
          .print-content *,
          .print-content table,
          .print-content table *,
          .print-content thead,
          .print-content thead *,
          .print-content tbody,
          .print-content tbody *,
          .print-content tr,
          .print-content tr *,
          .print-content th,
          .print-content th *,
          .print-content td,
          .print-content td * {
            visibility: visible !important;
          }
          
          /* Reset positioning for print */
          .fixed {
            position: static !important;
          }
          
          .print-content {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            transform: none !important;
          }
          
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          .print\\:block {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Page setup */
          @page {
            margin: 0.3in 0.2in;
            size: A4 landscape;
          }
          
          /* Prevent page breaks within table rows */
          .print-table {
            page-break-inside: auto !important;
          }
          
          .print-table thead {
            display: table-header-group !important;
          }
          
          .print-table tbody {
            display: table-row-group !important;
          }
          
          .print-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Table styling */
          table {
            font-size: 7px !important;
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 0 !important;
          }
          
          th, td {
            padding: 1px 2px !important;
            border: 1px solid #000 !important;
            text-align: left !important;
            font-size: 7px !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
          }
          
          th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            font-size: 7px !important;
          }
          
          /* Color preservation */
          .text-red-600 {
            color: #dc2626 !important;
          }
          
          .text-green-600 {
            color: #16a34a !important;
          }
          
          .text-blue-600 {
            color: #2563eb !important;
          }
          
          .bg-red-50 {
            background-color: #fef2f2 !important;
          }
          
          .bg-green-50 {
            background-color: #f0fdf4 !important;
          }
          
          .bg-blue-50 {
            background-color: #eff6ff !important;
          }
          
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
          
          /* Section spacing */
          .space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
          
          /* Header sizes for print */
          h1 {
            font-size: 16px !important;
            margin: 8px 0 !important;
          }
          
          h2 {
            font-size: 12px !important;
            margin: 6px 0 !important;
          }
          
          h3 {
            font-size: 10px !important;
            margin: 4px 0 !important;
          }
          
          /* Summary cards */
          .grid {
            display: block !important;
          }
          
          .grid > div {
            display: inline-block !important;
            width: 23% !important;
            margin: 0 0.5% !important;
            vertical-align: top !important;
          }
        }
      `}</style>
    </div>
  )
}