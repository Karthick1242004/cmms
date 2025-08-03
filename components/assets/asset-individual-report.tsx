"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Package, DollarSign, Calendar, Tag, Building, User, FileText, Wrench, Shield } from 'lucide-react'
import type { AssetDetail } from "@/types/asset"

interface AssetIndividualReportProps {
  asset: AssetDetail
  onClose: () => void
}

export function AssetIndividualReport({ asset, onClose }: AssetIndividualReportProps) {
  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'operational': case 'online': return 'text-green-600 bg-green-50'
      case 'maintenance': return 'text-yellow-600 bg-yellow-50'
      case 'out-of-service': case 'offline': return 'text-red-600 bg-red-50'
      case 'available': case 'in stock': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      case 'new': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  // Parse files and links
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:relative print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Header - No Print */}
        <div className="flex items-center justify-between p-6 border-b print:hidden">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Asset Individual Report</h2>
              <p className="text-sm text-gray-600">{asset.assetName}</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Individual Report</h1>
              <h2 className="text-xl text-gray-700 mb-2">{asset.assetName}</h2>
              <p className="text-lg text-gray-600">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Asset Overview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Asset Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Asset ID</h3>
                  </div>
                  <p className="text-sm  font-bold text-blue-600">{asset.id}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Status</h3>
                  </div>
                  <p className={`text-lg font-bold px-2 py-1 rounded ${getStatusColor(asset.statusText)}`}>
                    {asset.statusText}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Department</h3>
                  </div>
                  <p className="text-lg font-bold text-purple-600">{asset.department}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Value</h3>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    ${(asset.costPrice || asset.purchasePrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Asset Name</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.assetName}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Serial Number</td>
                      <td className="border border-gray-300 px-4 py-3 font-mono">{asset.serialNo || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">RFID</td>
                      <td className="border border-gray-300 px-4 py-3 font-mono">{asset.rfid || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Product Name</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.productName || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Category</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.categoryName || asset.category}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Asset Class</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.assetClass || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Manufacturer</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.manufacturer || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Construction Year</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.constructionYear || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Location</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.location || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Size</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.size || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Condition</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={`font-semibold ${getConditionColor(asset.condition || 'unknown')}`}>
                          {asset.condition?.charAt(0).toUpperCase() + (asset.condition?.slice(1) || 'Unknown')}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Asset Type</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.assetType || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Out of Order</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={asset.outOfOrder === 'Yes' ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {asset.outOfOrder || 'No'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Is Active</td>
                      <td className="border border-gray-300 px-4 py-3">
                        <span className={asset.isActive === 'No' ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {asset.isActive || 'Yes'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Financial Information
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Cost Price</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-green-600">
                        ${(asset.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Purchase Price</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-green-600">
                        ${(asset.purchasePrice || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Sales Price</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-600">
                        ${(asset.salesPrice || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Expected Life Span</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.expectedLifeSpan || 'N/A'} years</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">UOM</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.uom || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Production Hours Daily</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.productionHoursDaily || 0} hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dates & Warranty */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-purple-600" />
                Dates & Warranty Information
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Purchase Date</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.purchaseDate || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Commissioning Date</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.commissioningDate || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Warranty Start</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.warrantyStart || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">End of Warranty</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.endOfWarranty || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Allocated To</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.allocated || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">Allocated On</td>
                      <td className="border border-gray-300 px-4 py-3">{asset.allocatedOn || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parts BOM */}
            {asset.partsBOM && asset.partsBOM.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-orange-600" />
                  Parts Bill of Materials ({asset.partsBOM.length} Parts)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-orange-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Part Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Part Number</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Quantity</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Unit Price</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Cost</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Supplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.partsBOM.map((part, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{part.partName || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{part.partNumber || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{part.quantity || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">${(part.unitPrice || 0).toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                            ${((part.quantity || 0) * (part.unitPrice || 0)).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{part.supplier || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Personnel & Businesses */}
            {((asset.personnel && asset.personnel.length > 0) || (asset.businesses && asset.businesses.length > 0)) && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Associated Personnel & Businesses
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {asset.personnel && asset.personnel.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Personnel</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Name</th>
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Role</th>
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Contact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asset.personnel.map((person, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm">{person.name || 'N/A'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{person.role || 'N/A'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{person.contact || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {asset.businesses && asset.businesses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Businesses</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-green-50">
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Business Name</th>
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Type</th>
                              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Contact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asset.businesses.map((business, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm">{business.name || 'N/A'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{business.type || 'N/A'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{business.contact || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Files and Links */}
            {((regularFiles && regularFiles.length > 0) || (links && links.length > 0)) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  Files & Documentation
                </h2>
                
                {/* Files Section */}
                {regularFiles && regularFiles.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Files</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">File Name</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Type</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regularFiles.map((file, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">{file.name || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{file.type || file.category || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{file.size || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Links Section - Full Width */}
                {links && links.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Links</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Link Name</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">Type</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {links.map((link, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">{link.name || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">{link.type || 'N/A'}</td>
                              <td className="border border-gray-300 px-3 py-2 text-xs font-mono">
                                {link.url ? (link.url.length > 80 ? link.url.substring(0, 80) + '...' : link.url) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {asset.description && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Description</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{asset.description}</p>
                </div>
              </div>
            )}

            {/* Report Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-gray-600">
              <p className="text-sm">
                Individual Asset Report for <strong>{asset.assetName}</strong> (ID: {asset.id})
              </p>
              <p className="text-xs mt-1">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
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
          .print-content * {
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
            size: A4 portrait;
          }
          
          table {
            font-size: 8px !important;
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 0 !important;
          }
          
          th, td {
            padding: 2px 3px !important;
            border: 1px solid #000 !important;
            text-align: left !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
          }
          
          th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            font-size: 8px !important;
          }
          
          .text-red-600 { color: #dc2626 !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-yellow-600 { color: #ca8a04 !important; }
          .text-purple-600 { color: #9333ea !important; }
          .text-orange-600 { color: #ea580c !important; }
          .text-gray-600 { color: #4b5563 !important; }
          
          .bg-red-50 { background-color: #fef2f2 !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-yellow-50 { background-color: #fefce8 !important; }
          .bg-purple-50 { background-color: #faf5ff !important; }
          .bg-orange-50 { background-color: #fff7ed !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          
          .space-y-4 > * + * {
            margin-top: 0.3rem !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 0.4rem !important;
          }
          
          /* Readable header sizes for 1-2 pages */
          h1 {
            font-size: 16px !important;
            margin: 6px 0 !important;
          }
          
          h2 {
            font-size: 12px !important;
            margin: 4px 0 !important;
          }
          
          h3 {
            font-size: 10px !important;
            margin: 3px 0 !important;
          }
          
          /* Readable overview cards */
          .grid > div {
            padding: 3px !important;
            margin: 2px !important;
            font-size: 8px !important;
          }
          
          /* Balanced section spacing */
          .print-content > div {
            margin-bottom: 0.4rem !important;
          }
          
          /* Reasonable print content padding */
          .print-content {
            padding: 6px !important;
          }
          
          .grid {
            display: block !important;
          }
          
          .grid > div {
            display: inline-block !important;
            width: 23% !important;
            margin: 0 0.5% !important;
            vertical-align: top !important;
            padding: 2px !important;
            font-size: 6px !important;
          }
          
          .md\\:grid-cols-2 > div {
            width: 48% !important;
            margin: 0 1% !important;
          }
          
          /* Allow natural page breaks for 1-2 pages */
          .space-y-4, .space-y-6 {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          
          /* Allow page breaks where needed but avoid orphans */
          table {
            page-break-inside: auto !important;
          }
          
          table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Readable description box */
          .bg-gray-50 {
            padding: 4px !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
          }
          
          /* Readable text elements */
          p, span, div {
            font-size: 8px !important;
            line-height: 1.2 !important;
            margin: 1px 0 !important;
          }
          
          /* Ensure sections can break across pages naturally */
          h2 {
            page-break-after: avoid !important;
          }
          
          /* Keep table headers with content */
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>
    </div>
  )
}