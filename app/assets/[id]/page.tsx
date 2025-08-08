"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useNavigation } from "@/hooks/use-navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  List,
  PlusCircle,
  QrCode,
  Barcode,
  Package,
  DollarSign,
  CalendarDays,
  Tag,
  Users,
  FileText,
  History,
  ShieldCheck,
  Building,
  Wrench,
  UserCircle,
  Trash2,
  Upload,
  Printer,
} from "lucide-react"
import type { AssetDetail } from "@/types/asset"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { assetsApi } from "@/lib/assets-api"
import { AssetIndividualReport } from "@/components/assets/asset-individual-report"

interface DetailItemProps {
  label: string
  value?: string | number | null
  className?: string
  icon?: React.ElementType
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className, icon: Icon }) => (
  <div className={className}>
    <p className="text-xs text-muted-foreground flex items-center">
      {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
      {label}
    </p>
    <p className="text-sm font-medium break-words">
      {value !== undefined && value !== null && value !== "" ? String(value) : "-"}
    </p>
  </div>
)

export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params.id as string
  const { navigate } = useNavigation()
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

  useEffect(() => {
    const fetchAsset = async () => {
    setIsLoading(true)
      setError(null)
      
      try {
        const response = await assetsApi.getAssetById(assetId)
        
        if (response.success && response.data) {
          setAsset(response.data)
        } else {
          setError(response.error || 'Failed to fetch asset details')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
      setIsLoading(false)
      }
    }

    fetchAsset()
  }, [assetId])

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </PageHeader>
        <PageContent>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Skeleton className="md:col-span-1 aspect-[3/2] rounded-lg" />
                <div className="md:col-span-2 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-full mb-4" /> {/* TabsList Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader>
          <h1 className="text-2xl font-bold">Error Loading Asset</h1>
        </PageHeader>
        <PageContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </PageContent>
      </PageLayout>
    )
  }

  if (!asset) {
    return (
      <PageLayout>
        <PageHeader>
          <h1 className="text-2xl font-bold">Asset Not Found</h1>
        </PageHeader>
        <PageContent>
          <p>The asset with ID {assetId} could not be found.</p>
        </PageContent>
      </PageLayout>
    )
  }

  const statusBadgeVariant =
    asset.statusText?.toLowerCase() === "online" ||
    asset.statusText?.toLowerCase() === "ok" ||
    asset.statusText?.toLowerCase() === "operational"
      ? "default"
      : asset.statusText?.toLowerCase().includes("maintenance")
        ? "secondary"
        : "destructive"

  const tabItems = [
    "General",
    "Parts/BOM",
    "Metering/Events",
    "Personnel",
    "Warranty",
    "Files",
    "Financials",
    "Purchase",
    "Associated Customer",
    "Log",
  ]

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary" />
              Asset Details
            </h1>
            <p className="text-muted-foreground">Viewing details for asset: {asset.assetName}</p>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button 
              onClick={() => setIsReportOpen(true)}
              variant="outline"
            >
              <Printer className="mr-2 h-4 w-4" /> Individual Report
            </Button>
            {/* <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Move To
            </Button> */}
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" /> Equipment List
            </Button>
            <Button onClick={() => navigate("/tickets")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Work Order
            </Button>
          </div>
        </div>
      </PageHeader>
      <PageContent>
        <Card className="overflow-hidden">
          <CardContent className="p-4 md:p-6">
            {/* Top Section: Image, Basic Info, QR/Barcode */}
            <div className="grid md:grid-cols-12 gap-6 mb-6 pb-6 border-b">
              <div className="md:col-span-4 lg:col-span-3">
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                  <Image
                    src={asset.imageSrc || "/placeholder.svg?height=150&width=250&query=asset+image"}
                    alt={asset.assetName}
                    width={250}
                    height={150}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-5 lg:col-span-6 space-y-2">
                <Badge variant={statusBadgeVariant} className="capitalize text-xs">
                  {asset.statusText}
                </Badge>
                <h2 className="text-xl font-semibold">{asset.assetName}</h2>
                <DetailItem label="Asset Name" value={asset.assetName} />
                <DetailItem label="Serial No." value={asset.serialNo} />
                <DetailItem label="RFID" value={asset.rfid} />
                <DetailItem label="Parent Asset" value={asset.parentAsset} />
                <DetailItem label="Product Name" value={asset.productName} />
                <DetailItem label="Category Name" value={asset.categoryName} />
              </div>
              <div className="md:col-span-3 lg:col-span-3 flex flex-col items-center md:items-end space-y-3">
                <div className="p-2 border rounded-md bg-white">
                  {asset.qrCodeSrc ? (
                    <Image
                      src={asset.qrCodeSrc}
                      alt="QR Code"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <QrCode className="h-16 w-16" />
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="general" className="w-full">
              <ScrollArea className="w-full whitespace-nowrap rounded-md border-b">
                <TabsList className="inline-flex h-auto p-1">
                  {tabItems.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab.toLowerCase().replace(/[^a-z0-9]/gi, "")}
                      className="text-xs sm:text-sm px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <TabsContent value="general" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                      <DetailItem label="Serial No." value={asset.serialNo} icon={Tag} />
                      <DetailItem label="RFID" value={asset.rfid} icon={QrCode} />
                      <DetailItem label="Product Name" value={asset.productName} icon={Package} />
                      <DetailItem label="Asset Name" value={asset.assetName} icon={Package} />
                      <DetailItem label="Asset Class" value={asset.assetClass} icon={Wrench} />
                      <DetailItem label="Asset Type" value={asset.assetType} icon={ShieldCheck} />
                      <DetailItem label="Construction year" value={asset.constructionYear} icon={CalendarDays} />
                      <DetailItem label="Commissioning Date" value={asset.commissioningDate} icon={CalendarDays} />
                      <DetailItem label="Warranty Start" value={asset.warrantyStart} icon={CalendarDays} />
                      <DetailItem label="End Of Warranty" value={asset.endOfWarranty} icon={CalendarDays} />
                      <DetailItem label="Manufacturer" value={asset.manufacturer} icon={Building} />
                      <DetailItem label="Expected Life span (Years)" value={asset.expectedLifeSpan} icon={History} />
                      <DetailItem label="Out Of Order" value={asset.outOfOrder} icon={AlertTriangle} />
                      <DetailItem label="Deleted" value={asset.deleted} icon={Trash2} />
                      <DetailItem label="Is Active" value={asset.isActive} icon={CheckCircle2} />
                      <DetailItem label="Allocated" value={asset.allocated} icon={Users} />
                      <DetailItem label="Category" value={asset.category} icon={Tag} />
                      <DetailItem label="Allocated On" value={asset.allocatedOn} icon={CalendarDays} />
                      <DetailItem label="Size" value={asset.size} />
                      <DetailItem label="UoM" value={asset.uom} />
                      <DetailItem label="Cost Price" value={`USD ${asset.costPrice?.toFixed(2)}`} icon={DollarSign} />
                      <DetailItem label="Sales Price" value={`USD ${asset.salesPrice?.toFixed(2)}`} icon={DollarSign} />
                      <DetailItem label="Production Hours (daily)" value={asset.productionHoursDaily} icon={History} />
                      <DetailItem label="Status" value={asset.statusText} icon={CheckCircle2} />
                      <DetailItem label="Service Status" value={asset.serviceStatus} />
                      <DetailItem label="Last Enquiry Date" value={asset.lastEnquiryDate} icon={CalendarDays} />
                      <DetailItem
                        label="Description"
                        value={asset.description}
                        className="md:col-span-2 lg:col-span-3"
                        icon={FileText}
                      />
                      <DetailItem label="Last Enquiry By" value={asset.lastEnquiryBy} icon={UserCircle} />
                      <DetailItem label="Production Time" value={asset.productionTime} />
                      <DetailItem label="Shelf Life (In Month)" value={asset.shelfLifeInMonth} />
                      <DetailItem label="Line Number" value={asset.lineNumber} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Parts/BOM Tab */}
              <TabsContent value="partsbom" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Parts/BOM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.partsBOM && asset.partsBOM.length > 0 ? (
                      <div className="space-y-4">
                        {asset.partsBOM.map((part: any, index: number) => (
                          <div key={part.id || index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <DetailItem label="Part Name" value={part.partName} />
                              <DetailItem label="Part Number" value={part.partNumber} />
                              <DetailItem label="Quantity" value={part.quantity} />
                              <DetailItem label="Unit Cost" value={`USD ${part.unitCost?.toFixed(2)}`} />
                              <DetailItem label="Supplier" value={part.supplier} />
                              <DetailItem label="Last Replaced" value={part.lastReplaced} />
                              <DetailItem label="Next Maintenance" value={part.nextMaintenanceDate} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No parts/BOM data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Metering/Events Tab */}
              <TabsContent value="meteringevents" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metering/Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.meteringEvents && asset.meteringEvents.length > 0 ? (
                      <div className="space-y-4">
                        {asset.meteringEvents.map((event: any, index: number) => (
                          <div key={event.id || index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <DetailItem label="Event Type" value={event.eventType} />
                              <DetailItem label="Reading" value={`${event.reading} ${event.unit}`} />
                              <DetailItem label="Recorded Date" value={event.recordedDate} />
                              <DetailItem label="Recorded By" value={event.recordedBy} />
                              <DetailItem label="Notes" value={event.notes} className="md:col-span-2 lg:col-span-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No metering/events data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personnel Tab */}
              <TabsContent value="personnel" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.personnel && asset.personnel.length > 0 ? (
                      <div className="space-y-4">
                        {asset.personnel.map((person: any, index: number) => (
                          <div key={person.id || index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <DetailItem label="Name" value={person.name} />
                              <DetailItem label="Role" value={person.role} />
                              <DetailItem label="Email" value={person.email} />
                              <DetailItem label="Phone" value={person.phone} />
                              <DetailItem label="Assigned Date" value={person.assignedDate} />
                              <DetailItem label="Responsibilities" value={person.responsibilities?.join(', ')} className="md:col-span-2 lg:col-span-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No personnel data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Warranty Tab */}
              <TabsContent value="warranty" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Warranty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.warrantyDetails ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <DetailItem label="Provider" value={asset.warrantyDetails.provider} />
                          <DetailItem label="Type" value={asset.warrantyDetails.type} />
                          <DetailItem label="Start Date" value={asset.warrantyDetails.startDate} />
                          <DetailItem label="End Date" value={asset.warrantyDetails.endDate} />
                          <DetailItem label="Coverage" value={asset.warrantyDetails.coverage} />
                          <DetailItem label="Contact Info" value={asset.warrantyDetails.contactInfo} />
                          <DetailItem label="Terms" value={asset.warrantyDetails.terms} className="md:col-span-2 lg:col-span-3" />
                        </div>
                        {asset.warrantyDetails.claimHistory && asset.warrantyDetails.claimHistory.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3">Claim History</h4>
                            <div className="space-y-2">
                              {asset.warrantyDetails.claimHistory.map((claim: any, index: number) => (
                                <div key={claim.claimNumber || index} className="border rounded-lg p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                    <DetailItem label="Claim Number" value={claim.claimNumber} />
                                    <DetailItem label="Date" value={claim.date} />
                                    <DetailItem label="Issue" value={claim.issue} />
                                    <DetailItem label="Status" value={claim.status} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No warranty data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>



              {/* Files Tab */}
              <TabsContent value="files" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.files && asset.files.length > 0 ? (
                      <div className="space-y-4">
                        {asset.files.map((fileData: any, index: number) => {
                          // Parse file data if it's a JSON string
                          const file = (() => {
                            try {
                              return typeof fileData === 'string' ? JSON.parse(fileData) : fileData
                            } catch {
                              return fileData
                            }
                          })()
                          
                          return (
                          <div key={file.id || index} className="border rounded-lg p-4">
                            {/* Check if this is a link (has url property) or regular file */}
                            {file.url ? (
                              // Display as link
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-lg">{file.name || 'Unnamed Link'}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {file.type || 'link'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <DetailItem label="Link Name" value={file.name} />
                                  <DetailItem label="Type" value={file.type} />
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">URL</label>
                                    <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Upload className="h-3 w-3" />
                                      Open Link
                                    </a>
                                  </div>
                                  {file.description && (
                                    <DetailItem 
                                      label="Description" 
                                      value={file.description} 
                                      className="md:col-span-2 lg:col-span-3" 
                                    />
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Display as regular file
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <DetailItem label="File Name" value={file.name} />
                                <DetailItem label="Type" value={file.type} />
                                <DetailItem label="Category" value={file.category} />
                                <DetailItem label="Size" value={file.size} />
                                <DetailItem label="Upload Date" value={file.uploadDate} />
                                <DetailItem label="Uploaded By" value={file.uploadedBy} />
                                <DetailItem label="Description" value={file.description} className="md:col-span-2 lg:col-span-3" />
                              </div>
                            )}
                          </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No files or links available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financials Tab */}
              <TabsContent value="financials" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.financials ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Total Cost of Ownership" value={`USD ${asset.financials.totalCostOfOwnership?.toFixed(2)}`} />
                        <DetailItem label="Annual Operating Cost" value={`USD ${asset.financials.annualOperatingCost?.toFixed(2)}`} />
                        <DetailItem label="Depreciation Rate" value={`${(asset.financials.depreciationRate * 100)?.toFixed(1)}%`} />
                        <DetailItem label="Current Book Value" value={`USD ${asset.financials.currentBookValue?.toFixed(2)}`} />
                        <DetailItem label="Maintenance Cost YTD" value={`USD ${asset.financials.maintenanceCostYTD?.toFixed(2)}`} />
                        <DetailItem label="Fuel Cost YTD" value={`USD ${asset.financials.fuelCostYTD?.toFixed(2)}`} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No financial data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Purchase Tab */}
              <TabsContent value="purchase" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.purchaseInfo ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Purchase Order Number" value={asset.purchaseInfo.purchaseOrderNumber} />
                        <DetailItem label="Vendor" value={asset.purchaseInfo.vendor} />
                        <DetailItem label="Requested By" value={asset.purchaseInfo.requestedBy} />
                        <DetailItem label="Approved By" value={asset.purchaseInfo.approvedBy} />
                        <DetailItem label="Purchase Date" value={asset.purchaseInfo.purchaseDate} />
                        <DetailItem label="Delivery Date" value={asset.purchaseInfo.deliveryDate} />
                        <DetailItem label="Invoice Number" value={asset.purchaseInfo.invoiceNumber} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No purchase data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Associated Customer Tab */}
              <TabsContent value="associatedcustomer" className="mt-4">
                    <Card>
                      <CardHeader>
                    <CardTitle className="text-lg">Associated Customer</CardTitle>
                      </CardHeader>
                      <CardContent>
                    {asset.associatedCustomer ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DetailItem label="Customer Name" value={asset.associatedCustomer.name} />
                        <DetailItem label="Type" value={asset.associatedCustomer.type} />
                        <DetailItem label="Contact Person" value={asset.associatedCustomer.contactPerson} />
                        <DetailItem label="Email" value={asset.associatedCustomer.email} />
                        <DetailItem label="Projects" value={asset.associatedCustomer.projects?.join(', ')} className="md:col-span-2 lg:col-span-3" />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No associated customer data available for this asset.</p>
                    )}
                      </CardContent>
                    </Card>
                  </TabsContent>

              {/* Log Tab */}
              <TabsContent value="log" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.log && asset.log.length > 0 ? (
                      <div className="space-y-4">
                        {asset.log.map((logEntry: any, index: number) => (
                          <div key={logEntry.id || index} className="border rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <DetailItem label="Date" value={logEntry.date} />
                              <DetailItem label="Action" value={logEntry.action} />
                              <DetailItem label="Performed By" value={logEntry.performedBy} />
                              <DetailItem label="Category" value={logEntry.category} />
                              <DetailItem label="Details" value={logEntry.details} className="md:col-span-2 lg:col-span-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No log data available for this asset.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PageContent>

      {/* Asset Individual Report */}
      {isReportOpen && asset && (
        <AssetIndividualReport 
          asset={asset}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </PageLayout>
  )
}
