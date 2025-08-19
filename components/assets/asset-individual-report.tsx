"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Download, Package } from 'lucide-react'
import type { AssetDetail } from "@/types/asset"

interface AssetIndividualReportProps {
  asset: AssetDetail
  onClose: () => void
}

export function AssetIndividualReport({ asset, onClose }: AssetIndividualReportProps) {
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
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Asset Individual Report - ${asset.assetName}</title>
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
          
          .asset-name {
            font-size: 20px;
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
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-operational { background: #dcfce7; color: #166534; }
          .status-maintenance { background: #fef3c7; color: #92400e; }
          .status-out-of-service { background: #fee2e2; color: #991b1b; }
          .status-available { background: #dbeafe; color: #1e40af; }
          
          .condition-excellent { color: #059669; }
          .condition-good { color: #2563eb; }
          .condition-fair { color: #d97706; }
          .condition-poor { color: #dc2626; }
          .condition-new { color: #7c3aed; }
          
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
          <h1 class="report-title">Asset Individual Report</h1>
          <h2 class="asset-name">${asset.assetName}</h2>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📦 Asset Overview
          </h2>
          <div class="overview-grid">
            <div class="overview-card">
              <h3>Asset ID</h3>
              <div class="value">${asset.id}</div>
            </div>
            <div class="overview-card">
              <h3>Status</h3>
              <div class="value">
                <span class="status-badge status-${(asset.statusText || 'unknown').toLowerCase().replace(/\s+/g, '-')}">
                  ${asset.statusText || 'Unknown'}
                </span>
              </div>
            </div>
            <div class="overview-card">
              <h3>Department</h3>
              <div class="value">${asset.department || 'N/A'}</div>
            </div>
            <div class="overview-card">
              <h3>Value</h3>
              <div class="value">$${(asset.costPrice || asset.purchasePrice || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            ℹ️ Basic Information
          </h2>
          <table>
            <tr>
              <th>Asset Name</th>
              <td>${asset.assetName}</td>
              <th>Serial Number</th>
              <td>${asset.serialNo || 'N/A'}</td>
            </tr>
            <tr>
              <th>RFID</th>
              <td>${asset.rfid || 'N/A'}</td>
              <th>Product Name</th>
              <td>${asset.productName || 'N/A'}</td>
            </tr>
            <tr>
              <th>Category</th>
              <td>${asset.categoryName || asset.category || 'N/A'}</td>
              <th>Asset Class</th>
              <td>${asset.assetClass || 'N/A'}</td>
            </tr>
            <tr>
              <th>Manufacturer</th>
              <td>${asset.manufacturer || 'N/A'}</td>
              <th>Construction Year</th>
              <td>${asset.constructionYear || 'N/A'}</td>
            </tr>
            <tr>
              <th>Location</th>
              <td>${asset.location || 'N/A'}</td>
              <th>Size</th>
              <td>${asset.size || 'N/A'}</td>
            </tr>
            <tr>
              <th>Condition</th>
              <td>
                <span class="condition-${(asset.condition || 'unknown').toLowerCase()}">
                  ${(asset.condition || 'Unknown').charAt(0).toUpperCase() + (asset.condition || 'Unknown').slice(1)}
                </span>
              </td>
              <th>Asset Type</th>
              <td>${asset.assetType || 'N/A'}</td>
            </tr>
            <tr>
              <th>Out of Order</th>
              <td style="color: ${asset.outOfOrder === 'Yes' ? '#dc2626' : '#059669'}; font-weight: bold;">
                ${asset.outOfOrder || 'No'}
              </td>
              <th>Is Active</th>
              <td style="color: ${asset.isActive === 'No' ? '#dc2626' : '#059669'}; font-weight: bold;">
                ${asset.isActive || 'Yes'}
              </td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            💰 Financial Information
          </h2>
          <table>
            <tr>
              <th>Cost Price</th>
              <td class="financial-highlight">$${(asset.costPrice || 0).toFixed(2)}</td>
              <th>Purchase Price</th>
              <td class="financial-highlight">$${(asset.purchasePrice || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <th>Sales Price</th>
              <td class="financial-secondary">$${(asset.salesPrice || 0).toFixed(2)}</td>
              <th>Expected Life Span</th>
              <td>${asset.expectedLifeSpan || 'N/A'} years</td>
            </tr>
            <tr>
              <th>UOM</th>
              <td>${asset.uom || 'N/A'}</td>
              <th>Production Hours Daily</th>
              <td>${asset.productionHoursDaily || 0} hours</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📅 Dates & Warranty Information
          </h2>
          <table>
            <tr>
              <th>Purchase Date</th>
              <td>${asset.purchaseDate || 'N/A'}</td>
              <th>Commissioning Date</th>
              <td>${asset.commissioningDate || 'N/A'}</td>
            </tr>
            <tr>
              <th>Warranty Start</th>
              <td>${asset.warrantyStart || 'N/A'}</td>
              <th>End of Warranty</th>
              <td>${asset.endOfWarranty || 'N/A'}</td>
            </tr>
            <tr>
              <th>Allocated To</th>
              <td>${asset.allocated || 'N/A'}</td>
              <th>Allocated On</th>
              <td>${asset.allocatedOn || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        ${asset.partsBOM && asset.partsBOM.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            🔧 Parts Bill of Materials (${asset.partsBOM.length} Parts)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Cost</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              ${asset.partsBOM.map(part => `
                <tr>
                  <td>${part.partName || 'N/A'}</td>
                  <td>${part.partNumber || 'N/A'}</td>
                  <td>${part.quantity || 0}</td>
                  <td>$${(part.unitPrice || 0).toFixed(2)}</td>
                  <td class="financial-highlight">$${((part.quantity || 0) * (part.unitPrice || 0)).toFixed(2)}</td>
                  <td>${part.supplier || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${asset.personnel && asset.personnel.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            👥 Associated Personnel
          </h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${asset.personnel.map((person: any) => `
                <tr>
                  <td>${person.name || 'N/A'}</td>
                  <td>${person.role || 'N/A'}</td>
                  <td>${person.contact || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${((asset.files && asset.files.length > 0) || (asset.links && asset.links.length > 0)) ? `
        <div class="section">
          <h2 class="section-title">
            📁 Files & Documentation
          </h2>
          ${(() => {
            const allFiles = asset.files || []
            const parsedFiles = allFiles.map(file => {
              try {
                return typeof file === 'string' ? JSON.parse(file) : file
              } catch {
                return file
              }
            })
            const regularFiles = parsedFiles.filter(file => !file.url && !file.isLink)
            const links = [...parsedFiles.filter(file => file.url || file.isLink), ...(asset.links || [])]
            
            let html = ''
            
            if (regularFiles && regularFiles.length > 0) {
              html += `
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e40af;">Files</h3>
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${regularFiles.map(file => `
                      <tr>
                        <td>${file.name || 'N/A'}</td>
                        <td>${file.type || file.category || 'N/A'}</td>
                        <td>${file.size || 'N/A'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
            }
            
            if (links && links.length > 0) {
              html += `
                <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e40af; margin-top: 20px;">Links</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Link Name</th>
                      <th>Type</th>
                      <th>URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${links.map(link => `
                      <tr>
                        <td>${link.name || 'N/A'}</td>
                        <td>${link.type || 'N/A'}</td>
                        <td style="font-size: 10px; font-family: monospace;">
                          ${link.url ? (link.url.length > 80 ? link.url.substring(0, 80) + '...' : link.url) : 'N/A'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
            }
            
            return html
          })()}
        </div>
        ` : ''}
        
        ${asset.description ? `
        <div class="section">
          <h2 class="section-title">
            📝 Description
          </h2>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
            <p style="color: #374151; white-space: pre-wrap;">${asset.description}</p>
          </div>
        </div>
        ` : ''}
        
        <div class="report-footer">
          <p>Individual Asset Report for <strong>${asset.assetName}</strong> (ID: ${asset.id})</p>
          <p style="margin-top: 4px;">Generated on ${currentDate} at ${currentTime}</p>
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
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Asset Individual Report
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a comprehensive report for <strong>{asset.assetName}</strong> that opens in a new window with print functionality.
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
