"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Added for horizontal scroll
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
} from "lucide-react"
import type { AssetDetail } from "@/types/asset"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { sampleAssetDetails } from "@/data/assets-sample" // Import sample data

// Mock data - replace with actual data fetching
// const mockAssetDetail: AssetDetail = { ... } // Using sampleAssetDetails now

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
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      const foundAsset = sampleAssetDetails.find((a) => a.id === assetId) || sampleAssetDetails[0] // Fallback to first for demo
      setAsset(foundAsset)
      setIsLoading(false)
    }, 1000)
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
    "Businesses",
    "Files",
    "Financials",
    "Purchase",
    "Associated Customer",
    "Log",
  ]

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary" />
              Asset Details
            </h1>
            <p className="text-muted-foreground">Viewing details for asset: {asset.assetName}</p>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Move To
            </Button>
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" /> Equipment List
            </Button>
            <Button>
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
                  <QrCode className="h-16 w-16" />
                </div>
                <div className="p-2 border rounded-md bg-white w-full max-w-[150px]">
                  <Barcode className="h-10 w-full" />
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
              {tabItems
                .filter((t) => t !== "General")
                .map((tabValue) => (
                  <TabsContent
                    key={tabValue}
                    value={tabValue.toLowerCase().replace(/[^a-z0-9]/gi, "")}
                    className="mt-4"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="capitalize">{tabValue}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Details for {tabValue} will be displayed here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
            </Tabs>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  )
}
