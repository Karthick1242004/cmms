"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import type { StockTransaction } from "@/types/stock-transaction"

interface StockTransactionInventoryReportProps {
  transactions: StockTransaction[]
  onClose: () => void
}

export function StockTransactionInventoryReport({ transactions, onClose }: StockTransactionInventoryReportProps) {
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
    const totalTransactions = transactions.length
    const receiptTransactions = transactions.filter(t => t.transactionType === 'receipt')
    const issueTransactions = transactions.filter(t => t.transactionType === 'issue')
    const transferInTransactions = transactions.filter(t => t.transactionType === 'transfer_in')
    const transferOutTransactions = transactions.filter(t => t.transactionType === 'transfer_out')
    const adjustmentTransactions = transactions.filter(t => t.transactionType === 'adjustment')
    const scrapTransactions = transactions.filter(t => t.transactionType === 'scrap')
    
    const totalReceiptValue = receiptTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const totalIssueValue = issueTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const totalInventoryValue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    
    // Group by transaction type for analysis
    const transactionsByType = [
      { type: 'Receipt', count: receiptTransactions.length, value: totalReceiptValue, description: 'Stock received from suppliers' },
      { type: 'Issue', count: issueTransactions.length, value: totalIssueValue, description: 'Stock issued to departments/employees' },
      { type: 'Transfer In', count: transferInTransactions.length, value: transferInTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0), description: 'Stock transferred in from other locations' },
      { type: 'Transfer Out', count: transferOutTransactions.length, value: transferOutTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0), description: 'Stock transferred out to other locations' },
      { type: 'Adjustment', count: adjustmentTransactions.length, value: adjustmentTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0), description: 'Stock level adjustments' },
      { type: 'Scrap', count: scrapTransactions.length, value: scrapTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0), description: 'Stock scrapped/disposed' }
    ].filter(item => item.count > 0)
    
    // Group by department
    const transactionsByDepartment = transactions.reduce((acc, transaction) => {
      const dept = transaction.department || 'Unknown'
      if (!acc[dept]) {
        acc[dept] = { 
          transactions: [], 
          totalValue: 0, 
          receiptCount: 0, 
          issueCount: 0,
          receiptValue: 0,
          issueValue: 0
        }
      }
      acc[dept].transactions.push(transaction)
      acc[dept].totalValue += transaction.totalAmount || 0
      
      if (transaction.transactionType === 'receipt') {
        acc[dept].receiptCount++
        acc[dept].receiptValue += transaction.totalAmount || 0
      } else if (transaction.transactionType === 'issue') {
        acc[dept].issueCount++
        acc[dept].issueValue += transaction.totalAmount || 0
      }
      
      return acc
    }, {} as Record<string, any>)
    
    const departmentStats = Object.entries(transactionsByDepartment).map(([department, data]) => ({
      department,
      totalTransactions: data.transactions.length,
      totalValue: data.totalValue,
      receiptCount: data.receiptCount,
      issueCount: data.issueCount,
      receiptValue: data.receiptValue,
      issueValue: data.issueValue,
      netValue: data.receiptValue - data.issueValue
    })).sort((a, b) => b.totalValue - a.totalValue)
    
    // Recent high-value transactions
    const highValueTransactions = transactions
      .filter(t => (t.totalAmount || 0) > 100)
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, 10)
    
    // Group by status
    const statusGroups = transactions.reduce((acc, transaction) => {
      const status = transaction.status || 'unknown'
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 }
      }
      acc[status].count++
      acc[status].value += transaction.totalAmount || 0
      return acc
    }, {} as Record<string, any>)
    
    const statusStats = Object.entries(statusGroups).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      value: data.value,
      percentage: ((data.count / totalTransactions) * 100).toFixed(1)
    }))

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stock Transaction Inventory Report</title>
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
          
          .report-subtitle {
            font-size: 16px;
            color: #374151;
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
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
            font-size: 24px;
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
          
          .card-green { border-color: #10b981; background: #f0fdf4; }
          .card-green .value { color: #059669; }
          .card-green h3 { color: #047857; }
          
          .card-red { border-color: #ef4444; background: #fef2f2; }
          .card-red .value { color: #dc2626; }
          .card-red h3 { color: #991b1b; }
          
          .card-purple { border-color: #8b5cf6; background: #faf5ff; }
          .card-purple .value { color: #7c3aed; }
          .card-purple h3 { color: #6d28d9; }
          
          .card-yellow { border-color: #f59e0b; background: #fffbeb; }
          .card-yellow .value { color: #d97706; }
          .card-yellow h3 { color: #92400e; }
          
          .card-gray { border-color: #6b7280; background: #f9fafb; }
          .card-gray .value { color: #374151; }
          .card-gray h3 { color: #4b5563; }
          
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
          
          .financial-secondary {
            font-weight: bold;
            color: #2563eb;
          }
          
          .financial-warning {
            font-weight: bold;
            color: #dc2626;
          }
          
          .status-completed { color: #059669; font-weight: bold; }
          .status-pending { color: #d97706; font-weight: bold; }
          .status-cancelled { color: #dc2626; font-weight: bold; }
          .status-draft { color: #6b7280; font-weight: bold; }
          
          .transaction-receipt { background-color: #f0fdf4; }
          .transaction-issue { background-color: #fef2f2; }
          .transaction-transfer { background-color: #eff6ff; }
          .transaction-adjustment { background-color: #faf5ff; }
          .transaction-scrap { background-color: #fffbeb; }
          
          .metric-positive { color: #059669; font-weight: bold; }
          .metric-negative { color: #dc2626; font-weight: bold; }
          .metric-neutral { color: #6b7280; font-weight: bold; }
          
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
          <h1 class="report-title">Stock Transaction Inventory Report</h1>
          <p class="report-subtitle">Comprehensive Inventory Movement Analysis</p>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📊 Executive Summary
          </h2>
          <div class="summary-grid">
            <div class="summary-card card-blue">
              <h3>Total Transactions</h3>
              <div class="value">${totalTransactions}</div>
              <div class="subtitle">All inventory movements</div>
            </div>
            <div class="summary-card card-green">
              <h3>Total Receipt Value</h3>
              <div class="value">$${totalReceiptValue.toFixed(2)}</div>
              <div class="subtitle">${receiptTransactions.length} receipts</div>
            </div>
            <div class="summary-card card-red">
              <h3>Total Issue Value</h3>
              <div class="value">$${totalIssueValue.toFixed(2)}</div>
              <div class="subtitle">${issueTransactions.length} issues</div>
            </div>
            <div class="summary-card card-purple">
              <h3>Net Inventory Change</h3>
              <div class="value ${totalReceiptValue - totalIssueValue >= 0 ? 'metric-positive' : 'metric-negative'}">
                $${(totalReceiptValue - totalIssueValue).toFixed(2)}
              </div>
              <div class="subtitle">Receipt vs Issue difference</div>
            </div>
            <div class="summary-card card-yellow">
              <h3>Active Departments</h3>
              <div class="value">${Object.keys(transactionsByDepartment).length}</div>
              <div class="subtitle">Departments with transactions</div>
            </div>
            <div class="summary-card card-gray">
              <h3>Average Transaction Value</h3>
              <div class="value">$${totalTransactions > 0 ? (totalInventoryValue / totalTransactions).toFixed(2) : '0.00'}</div>
              <div class="subtitle">Mean transaction amount</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📈 Transaction Type Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Transaction Type</th>
                <th>Count</th>
                <th>Total Value</th>
                <th>Average Value</th>
                <th>Percentage of Total</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsByType.map(stat => `
                <tr class="transaction-${stat.type.toLowerCase().replace(' ', '-')}">
                  <td class="font-semibold">${stat.type}</td>
                  <td>${stat.count}</td>
                  <td class="financial-highlight">$${stat.value.toFixed(2)}</td>
                  <td>$${stat.count > 0 ? (stat.value / stat.count).toFixed(2) : '0.00'}</td>
                  <td class="font-medium">${((stat.count / totalTransactions) * 100).toFixed(1)}%</td>
                  <td class="text-sm">${stat.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            🏢 Department Performance Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Transactions</th>
                <th>Receipts</th>
                <th>Issues</th>
                <th>Receipt Value</th>
                <th>Issue Value</th>
                <th>Net Value</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${departmentStats.map(stat => `
                <tr>
                  <td class="font-semibold">${stat.department}</td>
                  <td>${stat.totalTransactions}</td>
                  <td class="metric-positive">${stat.receiptCount}</td>
                  <td class="metric-negative">${stat.issueCount}</td>
                  <td class="financial-highlight">$${stat.receiptValue.toFixed(2)}</td>
                  <td class="financial-warning">$${stat.issueValue.toFixed(2)}</td>
                  <td class="${stat.netValue >= 0 ? 'metric-positive' : 'metric-negative'}">
                    $${stat.netValue.toFixed(2)}
                  </td>
                  <td class="financial-secondary">$${stat.totalValue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📋 Transaction Status Overview
          </h2>
          <div class="summary-grid">
            ${statusStats.map(stat => `
              <div class="summary-card card-blue">
                <h3>${stat.status} Transactions</h3>
                <div class="value">${stat.count}</div>
                <div class="subtitle">${stat.percentage}% of total ($${stat.value.toFixed(2)})</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${highValueTransactions.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            💰 High-Value Transactions (Top 10)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Transaction #</th>
                <th>Date</th>
                <th>Type</th>
                <th>Department</th>
                <th>Description</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${highValueTransactions.map(transaction => `
                <tr>
                  <td class="font-mono">${transaction.transactionNumber}</td>
                  <td>${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td>
                    <span class="transaction-${transaction.transactionType}">
                      ${transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td>${transaction.department}</td>
                  <td class="text-sm">${transaction.description.length > 50 ? transaction.description.substring(0, 50) + '...' : transaction.description}</td>
                  <td class="status-${transaction.status}">${transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}</td>
                  <td>${transaction.totalItems || transaction.items?.length || 0}</td>
                  <td class="financial-highlight">$${(transaction.totalAmount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">
            📋 Complete Transaction History (${transactions.length} Transactions)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Transaction #</th>
                <th>Date</th>
                <th>Type</th>
                <th>Department</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Description</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Total Value</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => `
                <tr class="transaction-${transaction.transactionType}">
                  <td class="font-mono">${transaction.transactionNumber}</td>
                  <td class="text-sm">${new Date(transaction.transactionDate).toLocaleDateString()}</td>
                  <td class="font-medium">
                    ${transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1).replace('_', ' ')}
                  </td>
                  <td>${transaction.department}</td>
                  <td class="status-${transaction.status}">
                    ${transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
                  </td>
                  <td class="text-center">
                    <span class="${transaction.priority === 'urgent' ? 'financial-warning' : transaction.priority === 'high' ? 'financial-secondary' : 'metric-neutral'}">
                      ${transaction.priority?.charAt(0).toUpperCase() + transaction.priority?.slice(1)}
                    </span>
                  </td>
                  <td class="text-sm">${transaction.description.length > 40 ? transaction.description.substring(0, 40) + '...' : transaction.description}</td>
                  <td class="text-sm">${transaction.sourceLocation || 'N/A'}</td>
                  <td class="text-sm">${transaction.destinationLocation || 'N/A'}</td>
                  <td class="text-center">${transaction.totalItems || transaction.items?.length || 0}</td>
                  <td class="financial-highlight text-right">$${(transaction.totalAmount || 0).toFixed(2)}</td>
                  <td class="text-sm">${transaction.createdByName || transaction.createdBy || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="report-footer">
          <p>Report generated on ${currentDate} at ${currentTime}</p>
          <p style="margin-top: 4px;">
            This report contains ${transactions.length} transactions across ${Object.keys(transactionsByDepartment).length} departments
          </p>
          <p style="margin-top: 4px;">
            Total inventory movement value: $${totalInventoryValue.toFixed(2)} | Net inventory change: $${(totalReceiptValue - totalIssueValue).toFixed(2)}
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
            Stock Transaction Inventory Report
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a comprehensive inventory movement report for <strong>{transactions.length} transactions</strong> that opens in a new window with print functionality.
          </p>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
            <h4 className="font-medium text-blue-900 mb-2">Report includes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Executive summary with key metrics</li>
              <li>• Transaction type analysis</li>
              <li>• Department performance breakdown</li>
              <li>• High-value transaction highlights</li>
              <li>• Complete transaction history</li>
              <li>• Status and priority analysis</li>
            </ul>
          </div>
          
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
