"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Package, AlertTriangle, DollarSign, BarChart3, Building, Wrench, TrendingUp } from 'lucide-react'
import type { Asset } from "@/types/asset"

interface AssetsOverallReportProps {
  assets: Asset[]
  onClose: () => void
}

export function AssetsOverallReport({ assets, onClose }: AssetsOverallReportProps) {
  // Calculate summary statistics
  const totalAssets = assets.length
  const maintenanceAssets = assets.filter(asset => asset.status === "maintenance")
  const outOfServiceAssets = assets.filter(asset => asset.status === "out-of-service")
  const operationalAssets = assets.filter(asset => asset.status === "operational")
  const totalValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
  const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0

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

  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600'
      case 'maintenance': return 'text-yellow-600'
      case 'out-of-service': return 'text-red-600'
      case 'available': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      case 'new': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:relative print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Header - No Print */}
        <div className="flex items-center justify-between p-6 border-b print:hidden">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assets Overall Report</h2>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assets Overall Report</h1>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Total Assets</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalAssets}</p>
                  <p className="text-sm text-blue-700">All registered assets</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Operational</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{operationalAssets.length}</p>
                  <p className="text-sm text-green-700">Active & running</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">Maintenance</h3>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{maintenanceAssets.length}</p>
                  <p className="text-sm text-yellow-700">Under maintenance</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Out of Service</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{outOfServiceAssets.length}</p>
                  <p className="text-sm text-red-700">Requires attention</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Total Value</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">${totalValue.toFixed(2)}</p>
                  <p className="text-sm text-purple-700">Portfolio value</p>
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            {(maintenanceAssets.length > 0 || outOfServiceAssets.length > 0) && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Critical Issues ({maintenanceAssets.length + outOfServiceAssets.length} Assets)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Asset Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Asset Tag</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Department</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Location</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Condition</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...maintenanceAssets, ...outOfServiceAssets].map(asset => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{asset.name}</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{asset.assetTag || asset.id}</td>
                          <td className="border border-gray-300 px-4 py-2">{asset.type}</td>
                          <td className="border border-gray-300 px-4 py-2">{asset.department}</td>
                          <td className="border border-gray-300 px-4 py-2">{asset.location}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`font-semibold ${getStatusColor(asset.status)}`}>
                              {asset.status.charAt(0).toUpperCase() + asset.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={getConditionColor(asset.condition || 'unknown')}>
                              {asset.condition?.charAt(0).toUpperCase() + (asset.condition?.slice(1) || 'Unknown')}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">
                            ${(asset.purchasePrice || 0).toFixed(2)}
                          </td>
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
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Assets</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Avg Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">In Maintenance</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Out of Service</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Health %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryStats.map(stat => {
                      const healthPercentage = ((stat.totalAssets - stat.maintenanceCount - stat.outOfServiceCount) / stat.totalAssets) * 100
                      return (
                        <tr key={stat.category} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-semibold">{stat.category}</td>
                          <td className="border border-gray-300 px-4 py-2">{stat.totalAssets}</td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">${stat.totalValue.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">${stat.avgValue.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={stat.maintenanceCount > 0 ? 'text-yellow-600 font-semibold' : 'text-gray-600'}>
                              {stat.maintenanceCount}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={stat.outOfServiceCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {stat.outOfServiceCount}
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

            {/* Department Analysis */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="h-6 w-6 text-green-600" />
                Department Analysis
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Department</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Assets</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Value</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Operational</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">In Maintenance</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Health %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map(stat => (
                      <tr key={stat.department} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-semibold">{stat.department}</td>
                        <td className="border border-gray-300 px-4 py-2">{stat.totalAssets}</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">${stat.totalValue.toFixed(2)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600">{stat.operationalCount}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={stat.maintenanceCount > 0 ? 'text-yellow-600 font-semibold' : 'text-gray-600'}>
                            {stat.maintenanceCount}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={stat.healthPercentage >= 80 ? 'text-green-600' : stat.healthPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                            {stat.healthPercentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Condition Analysis */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                Asset Condition Analysis
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Condition</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Asset Count</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Percentage</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conditionStats.map(stat => (
                      <tr key={stat.condition} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-semibold">
                          <span className={getConditionColor(stat.condition)}>
                            {stat.condition.charAt(0).toUpperCase() + stat.condition.slice(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{stat.count}</td>
                        <td className="border border-gray-300 px-4 py-2">{stat.percentage.toFixed(1)}%</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">${stat.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Complete Assets Inventory */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Complete Assets Inventory ({assets.length} Assets)</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm print-table">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Asset Name</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Asset Tag</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Type</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Department</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Location</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Status</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Condition</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Purchase Date</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Purchase Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50 print-row">
                        <td className="border border-gray-300 px-2 py-1 font-medium text-xs">{asset.name}</td>
                        <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{asset.assetTag || asset.id}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{asset.type}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{asset.department}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{asset.location}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">
                          <span className={`font-medium ${getStatusColor(asset.status)}`}>
                            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1).replace('-', ' ')}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">
                          <span className={getConditionColor(asset.condition || 'unknown')}>
                            {asset.condition?.charAt(0).toUpperCase() + (asset.condition?.slice(1) || 'Unknown')}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{asset.purchaseDate || 'N/A'}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs font-semibold">
                          ${(asset.purchasePrice || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
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
                This report contains {assets.length} assets across {Object.keys(assetsByDepartment).length} departments and {Object.keys(assetsByCategory).length} categories
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
          
          body * {
            visibility: hidden !important;
          }
          
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
          
          @page {
            margin: 0.3in 0.2in;
            size: A4 landscape;
          }
          
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
          
          .text-red-600 { color: #dc2626 !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-yellow-600 { color: #ca8a04 !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-gray-600 { color: #4b5563 !important; }
          
          .bg-red-50 { background-color: #fef2f2 !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-yellow-50 { background-color: #fefce8 !important; }
          .bg-purple-50 { background-color: #faf5ff !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          
          .space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
          
          h1 {
            font-size: 16px !important;
            margin: 8px 0 !important;
          }
          
          h2 {
            font-size: 12px !important;
            margin: 6px 0 !important;
          }
          
          .grid {
            display: block !important;
          }
          
          .grid > div {
            display: inline-block !important;
            width: 19% !important;
            margin: 0 0.5% !important;
            vertical-align: top !important;
          }
        }
      `}</style>
    </div>
  )
}