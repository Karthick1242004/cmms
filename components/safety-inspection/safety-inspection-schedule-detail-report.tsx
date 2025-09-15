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
        <title>Safety Inspection Schedule Report - ${schedule.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          
          .header .date {
            font-size: 12px;
            color: #9ca3af;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          
          .info-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .priority-critical { background: #fee2e2; color: #dc2626; }
          .priority-high { background: #fed7aa; color: #ea580c; }
          .priority-medium { background: #fef3c7; color: #d97706; }
          .priority-low { background: #dcfce7; color: #16a34a; }
          
          .status-active { background: #dcfce7; color: #16a34a; }
          .status-inactive { background: #f1f5f9; color: #64748b; }
          .status-completed { background: #dcfce7; color: #16a34a; }
          .status-overdue { background: #fee2e2; color: #dc2626; }
          
          .risk-critical { background: #fee2e2; color: #dc2626; }
          .risk-high { background: #fed7aa; color: #ea580c; }
          .risk-medium { background: #fef3c7; color: #d97706; }
          .risk-low { background: #dcfce7; color: #16a34a; }
          
          .content-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            min-height: 60px;
          }
          
          .content-text {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 8px;
            vertical-align: middle;
          }
          
          @media print {
            body { padding: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Safety Inspection Schedule Report</h1>
          <div class="subtitle">Schedule ID: ${schedule.id}</div>
          <div class="date">Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <!-- Schedule Information Section -->
        <div class="section">
          <h2 class="section-title">📋 SCHEDULE INFORMATION</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">SCHEDULE ID</div>
              <div class="info-value">${schedule.id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">TITLE</div>
              <div class="info-value">${schedule.title}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ASSET</div>
              <div class="info-value">${schedule.assetName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">LOCATION</div>
              <div class="info-value">${schedule.location}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DEPARTMENT</div>
              <div class="info-value">${schedule.department}</div>
            </div>
            <div class="info-item">
              <div class="info-label">STATUS</div>
              <div class="info-value">
                <span class="status-badge status-${schedule.status}">${schedule.status.toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">PRIORITY</div>
              <div class="info-value">
                <span class="status-badge priority-${schedule.priority}">${schedule.priority.toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">RISK LEVEL</div>
              <div class="info-value">
                <span class="status-badge risk-${schedule.riskLevel}">${schedule.riskLevel.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Details Section -->
        <div class="section">
          <h2 class="section-title">📅 SCHEDULE DETAILS</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">FREQUENCY</div>
              <div class="info-value">${schedule.frequency}</div>
            </div>
            <div class="info-item">
              <div class="info-label">START DATE</div>
              <div class="info-value">${formatDate(schedule.startDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">NEXT DUE DATE</div>
              <div class="info-value">${formatDate(schedule.nextDueDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DAYS UNTIL DUE</div>
              <div class="info-value">${daysUntilDue} days</div>
            </div>
            <div class="info-item">
              <div class="info-label">ESTIMATED DURATION</div>
              <div class="info-value">${schedule.estimatedDuration} hours</div>
            </div>
            <div class="info-item">
              <div class="info-label">ASSIGNED INSPECTOR</div>
              <div class="info-value">${schedule.assignedInspector || 'Not assigned'}</div>
            </div>
            ${schedule.lastCompletedDate ? `
            <div class="info-item">
              <div class="info-label">LAST COMPLETED</div>
              <div class="info-value">${formatDate(schedule.lastCompletedDate)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Description Section -->
        <div class="section">
          <h2 class="section-title">📝 SUBJECT & DETAILS</h2>
          <div class="content-box">
            <div class="content-text">${schedule.description || 'No description provided'}</div>
          </div>
        </div>

        <!-- Safety Standards Section -->
        <div class="section">
          <h2 class="section-title">🛡️ SAFETY STANDARDS</h2>
          <div class="content-box">
            <div class="content-text">${schedule.safetyStandards.join(', ')}</div>
          </div>
        </div>

        <!-- Checklist Statistics Section -->
        <div class="section">
          <h2 class="section-title">📊 CHECKLIST STATISTICS</h2>
          <div class="grid-4">
            <div class="info-item">
              <div class="info-label">TOTAL CATEGORIES</div>
              <div class="info-value">${totalCategories}</div>
            </div>
            <div class="info-item">
              <div class="info-label">REQUIRED CATEGORIES</div>
              <div class="info-value">${requiredCategories}</div>
            </div>
            <div class="info-item">
              <div class="info-label">TOTAL ITEMS</div>
              <div class="info-value">${totalItems}</div>
            </div>
            <div class="info-item">
              <div class="info-label">REQUIRED ITEMS</div>
              <div class="info-value">${requiredItems}</div>
            </div>
          </div>
        </div>

        <!-- Risk Analysis Section -->
        <div class="section">
          <h2 class="section-title">⚠️ RISK ANALYSIS</h2>
          <div class="grid-4">
            ${Object.entries(riskDistribution).map(([risk, count]) => `
            <div class="info-item">
              <div class="info-label">${risk.charAt(0).toUpperCase() + risk.slice(1)} RISK</div>
              <div class="info-value">${count} items</div>
            </div>
            `).join('')}
          </div>
        </div>

        <!-- Checklist Categories Section -->
        <div class="section">
          <h2 class="section-title">📋 CHECKLIST CATEGORIES</h2>
          ${schedule.checklistCategories.map(category => `
          <div class="content-box" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0;">${category.categoryName}</h4>
              <div style="display: flex; gap: 8px; font-size: 12px; color: #6b7280;">
                <span>Weight: ${category.weight}%</span>
                <span>${category.required ? 'Required' : 'Optional'}</span>
              </div>
            </div>
            ${category.description ? `<p style="color: #6b7280; margin-bottom: 10px; font-size: 14px;">${category.description}</p>` : ''}
            <div style="font-size: 12px; color: #6b7280;">
              ${category.checklistItems.length} items (${category.checklistItems.filter(item => item.isRequired).length} required)
            </div>
          </div>
          `).join('')}
        </div>

        <!-- Schedule History Section -->
        <div class="section">
          <h2 class="section-title">📝 SCHEDULE HISTORY</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">CREATED AT</div>
              <div class="info-value">${formatDateTime(schedule.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">LAST UPDATED</div>
              <div class="info-value">${formatDateTime(schedule.updatedAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">CREATED BY</div>
              <div class="info-value">${schedule.createdBy}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Report generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p style="margin-top: 4px;">Safety Inspection Management System</p>
        </div>
      </body>
    </html>
    `
  }

  // Generate and open the report
  const reportHTML = generateReportHTML()
  
  // Open in new window
  const newWindow = window.open('about:blank', '_blank')
  if (newWindow) {
    newWindow.document.write(reportHTML)
    newWindow.document.close()
  }
}
