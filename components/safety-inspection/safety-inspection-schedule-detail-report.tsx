"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download, FileText, Shield } from 'lucide-react'
import type { SafetyInspectionSchedule } from "@/types/safety-inspection"

interface SafetyInspectionScheduleDetailReportProps {
  schedule: SafetyInspectionSchedule
  onClose: () => void
}

export function SafetyInspectionScheduleDetailReport({ schedule, onClose }: SafetyInspectionScheduleDetailReportProps) {
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
    
    // Calculate days until due
    const getDaysUntilDue = (dueDateString: string) => {
      const dueDate = new Date(dueDateString)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    
    const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)
    
    // Format dates
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
    
    // Calculate checklist statistics
    const totalCategories = schedule.checklistCategories.length
    const requiredCategories = schedule.checklistCategories.filter(cat => cat.required).length
    const totalItems = schedule.checklistCategories.reduce((sum, cat) => sum + cat.checklistItems.length, 0)
    const requiredItems = schedule.checklistCategories.reduce((sum, cat) => 
      sum + cat.checklistItems.filter(item => item.isRequired).length, 0
    )
    
    // Risk analysis
    const riskDistribution = schedule.checklistCategories.reduce((acc, cat) => {
      cat.checklistItems.forEach(item => {
        if (!acc[item.riskLevel]) acc[item.riskLevel] = 0
        acc[item.riskLevel]++
      })
      return acc
    }, {} as Record<string, number>)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Safety Inspection Schedule Detail - ${schedule.title}</title>
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
          
          .schedule-name {
            font-size: 20px;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .asset-info {
            font-size: 16px;
            color: #6b7280;
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
          
          .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .overview-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          
          .overview-card h3 {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
          }
          
          .overview-card .value {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          }
          
          .info-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
          }
          
          .info-section h4 {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
          }
          
          .info-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .info-label {
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
          }
          
          .status-active { color: #059669; }
          .status-overdue { color: #dc2626; }
          .status-completed { color: #6b7280; }
          .status-inactive { color: #9ca3af; }
          
          .priority-low { color: #059669; }
          .priority-medium { color: #2563eb; }
          .priority-high { color: #d97706; }
          .priority-critical { color: #dc2626; font-weight: bold; }
          
          .risk-low { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
          .risk-medium { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
          .risk-high { background: #fed7aa; color: #c2410c; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
          .risk-critical { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
          
          .due-overdue { color: #dc2626; font-weight: bold; }
          .due-soon { color: #d97706; font-weight: bold; }
          .due-normal { color: #059669; }
          
          .checklist-category {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;
          }
          
          .category-header {
            background: #f3f4f6;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .category-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
          }
          
          .category-meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: #6b7280;
          }
          
          .checklist-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .checklist-item:last-child {
            border-bottom: none;
          }
          
          .item-content {
            flex: 1;
          }
          
          .item-description {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 2px;
          }
          
          .item-standard {
            font-size: 12px;
            color: #6b7280;
          }
          
          .item-meta {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .required-badge {
            background: #dc2626;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .optional-badge {
            background: #6b7280;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .standards-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
          }
          
          .standard-badge {
            background: #eff6ff;
            color: #1e40af;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid #dbeafe;
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
          <h1 class="report-title">Safety Inspection Schedule Detail</h1>
          <h2 class="schedule-name">${schedule.title}</h2>
          <p class="asset-info">${schedule.assetName} • ${schedule.location} • ${schedule.department}</p>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📊 Schedule Overview
          </h2>
          <div class="overview-grid">
            <div class="overview-card">
              <h3>Status</h3>
              <div class="value status-${schedule.status}">${schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}</div>
            </div>
            <div class="overview-card">
              <h3>Priority</h3>
              <div class="value priority-${schedule.priority}">${schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)}</div>
            </div>
            <div class="overview-card">
              <h3>Risk Level</h3>
              <div class="value">
                <span class="risk-${schedule.riskLevel}">${schedule.riskLevel.charAt(0).toUpperCase() + schedule.riskLevel.slice(1)}</span>
              </div>
            </div>
            <div class="overview-card">
              <h3>Next Due</h3>
              <div class="value ${daysUntilDue < 0 ? 'due-overdue' : daysUntilDue <= 3 ? 'due-soon' : 'due-normal'}">
                ${formatDate(schedule.nextDueDate)}
              </div>
            </div>
            <div class="overview-card">
              <h3>Frequency</h3>
              <div class="value">${schedule.frequency === "custom" ? `Every ${schedule.customFrequencyDays} days` : schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}</div>
            </div>
            <div class="overview-card">
              <h3>Estimated Duration</h3>
              <div class="value">${schedule.estimatedDuration}h</div>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h4>Asset Information</h4>
              <div class="info-item">
                <span class="info-label">Asset Name:</span>
                <span class="info-value">${schedule.assetName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Asset Type:</span>
                <span class="info-value">${schedule.assetType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Asset Tag:</span>
                <span class="info-value">${schedule.assetTag || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value">${schedule.location}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Department:</span>
                <span class="info-value">${schedule.department}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h4>Schedule Details</h4>
              <div class="info-item">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${formatDate(schedule.startDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Completed:</span>
                <span class="info-value">${schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : 'Never'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Assigned Inspector:</span>
                <span class="info-value">${schedule.assignedInspector || 'Unassigned'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span class="info-value">${formatDateTime(schedule.createdAt)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Updated:</span>
                <span class="info-value">${formatDateTime(schedule.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          ${daysUntilDue !== null ? `
          <div style="margin-top: 16px; padding: 12px; border-radius: 8px; background: ${daysUntilDue < 0 ? '#fef2f2' : daysUntilDue <= 3 ? '#fffbeb' : '#f0fdf4'};">
            <strong style="color: ${daysUntilDue < 0 ? '#dc2626' : daysUntilDue <= 3 ? '#d97706' : '#059669'};">
              ${daysUntilDue < 0 
                ? `⚠️ OVERDUE by ${Math.abs(daysUntilDue)} days - Immediate attention required`
                : daysUntilDue === 0 
                ? '🚨 DUE TODAY - Schedule inspection immediately'
                : daysUntilDue <= 3
                ? `⏰ Due in ${daysUntilDue} days - Prepare for upcoming inspection`
                : `✅ ${daysUntilDue} days remaining until next inspection`
              }
            </strong>
          </div>
          ` : ''}
        </div>
        
        ${schedule.description ? `
        <div class="section">
          <h2 class="section-title">
            📝 Description
          </h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="white-space: pre-wrap; line-height: 1.6;">${schedule.description}</p>
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">
            🛡️ Safety Standards
          </h2>
          ${schedule.safetyStandards.length > 0 ? `
            <div class="standards-list">
              ${schedule.safetyStandards.map(standard => `
                <span class="standard-badge">${standard}</span>
              `).join('')}
            </div>
          ` : `
            <p style="color: #6b7280; font-style: italic;">No safety standards specified</p>
          `}
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📋 Checklist Overview
          </h2>
          <div class="overview-grid">
            <div class="overview-card">
              <h3>Total Categories</h3>
              <div class="value">${totalCategories}</div>
            </div>
            <div class="overview-card">
              <h3>Required Categories</h3>
              <div class="value">${requiredCategories}</div>
            </div>
            <div class="overview-card">
              <h3>Total Items</h3>
              <div class="value">${totalItems}</div>
            </div>
            <div class="overview-card">
              <h3>Required Items</h3>
              <div class="value">${requiredItems}</div>
            </div>
          </div>
          
          ${Object.keys(riskDistribution).length > 0 ? `
          <div style="margin-top: 20px;">
            <h4 style="margin-bottom: 12px; font-size: 16px; font-weight: 600;">Risk Distribution</h4>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              ${Object.entries(riskDistribution).map(([risk, count]) => `
                <div style="text-align: center;">
                  <div class="risk-${risk}" style="display: block; margin-bottom: 4px;">${risk.toUpperCase()}</div>
                  <div style="font-weight: 600; color: #374151;">${count} items</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h2 class="section-title">
            🔧 Detailed Checklist Categories
          </h2>
          ${schedule.checklistCategories.length === 0 ? `
            <div style="text-center; padding: 40px; color: #6b7280;">
              <p>No checklist categories defined for this inspection schedule.</p>
            </div>
          ` : `
            ${schedule.checklistCategories.map((category, categoryIndex) => `
              <div class="checklist-category">
                <div class="category-header">
                  <div class="category-title">${category.categoryName}</div>
                  <div class="category-meta">
                    <span>${category.required ? '🔴 Required' : '⚪ Optional'}</span>
                    <span>Weight: ${category.weight}%</span>
                    <span>Items: ${category.checklistItems.length}</span>
                  </div>
                  ${category.description ? `
                    <div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
                      ${category.description}
                    </div>
                  ` : ''}
                </div>
                ${category.checklistItems.map((item, itemIndex) => `
                  <div class="checklist-item">
                    <div class="item-content">
                      <div class="item-description">${item.description}</div>
                      ${item.safetyStandard ? `
                        <div class="item-standard">Standard: ${item.safetyStandard}</div>
                      ` : ''}
                      ${item.notes ? `
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                          Note: ${item.notes}
                        </div>
                      ` : ''}
                    </div>
                    <div class="item-meta">
                      ${item.isRequired ? '<span class="required-badge">REQUIRED</span>' : '<span class="optional-badge">OPTIONAL</span>'}
                      <span class="risk-${item.riskLevel}">${item.riskLevel.toUpperCase()}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          `}
        </div>
        
        <div class="report-footer">
          <p>Safety Inspection Schedule Detail Report generated on ${currentDate} at ${currentTime}</p>
          <p style="margin-top: 4px;">
            Schedule: ${schedule.title} | Asset: ${schedule.assetName} | Department: ${schedule.department}
          </p>
          <p style="margin-top: 4px;">
            Total checklist items: ${totalItems} (${requiredItems} required) across ${totalCategories} categories
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
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Schedule Detail Report
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a comprehensive detail report for <strong>{schedule.title}</strong> that opens in a new window with print functionality.
          </p>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
            <h4 className="font-medium text-blue-900 mb-2">Report includes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Complete schedule overview and status</li>
              <li>• Asset and location information</li>
              <li>• Safety standards and compliance details</li>
              <li>• Detailed checklist categories and items</li>
              <li>• Risk analysis and priority breakdown</li>
              <li>• Due date analysis and alerts</li>
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
