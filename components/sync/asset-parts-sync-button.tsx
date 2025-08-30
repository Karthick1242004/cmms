"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Sync, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Package,
  Wrench
} from "lucide-react"
import { toast } from "sonner"

interface AssetPartsSyncButtonProps {
  variant: 'asset-to-parts' | 'parts-to-assets'
  assetId?: string
  assetName?: string
  partId?: string
  partName?: string
  bomItems?: number
  linkedAssets?: number
  onSyncComplete?: () => void
}

export function AssetPartsSyncButton({
  variant,
  assetId,
  assetName,
  partId,
  partName,
  bomItems = 0,
  linkedAssets = 0,
  onSyncComplete
}: AssetPartsSyncButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const isAssetToPartsSync = variant === 'asset-to-parts'
  
  const handleSync = async () => {
    if (!assetId && !partId) {
      toast.error('Missing required ID for sync operation')
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication required')
      }

      let response
      let syncData

      if (isAssetToPartsSync) {
        // Sync asset BOM to parts
        syncData = {
          assetName,
          department: 'Engineering', // This should come from the actual asset data
          partsBOM: [] // This should come from the actual asset BOM data
        }

        response = await fetch(`/api/assets/${assetId}/sync-parts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(syncData),
        })
      } else {
        // Sync part assets to BOM
        syncData = {
          partNumber: partName?.split(' ')[0] || '', // Extract part number from name
          partName,
          department: 'Engineering', // This should come from the actual part data
          linkedAssets: [] // This should come from the actual part linked assets
        }

        response = await fetch(`/api/parts/${partId}/sync-assets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(syncData),
        })
      }

      const data = await response.json()
      setSyncResult(data)

      if (data.success) {
        toast.success(data.message)
        onSyncComplete?.()
      } else {
        toast.error(data.message || 'Sync operation failed')
      }

    } catch (error) {
      console.error('Sync error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setSyncResult({
        success: false,
        message: errorMessage,
        data: { errors: [errorMessage] }
      })
      toast.error(`Sync failed: ${errorMessage}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (syncResult?.success) return <CheckCircle className="h-4 w-4" />
    if (syncResult && !syncResult.success) return <AlertTriangle className="h-4 w-4" />
    return <Sync className="h-4 w-4" />
  }

  const getSyncButtonText = () => {
    if (isSyncing) return 'Syncing...'
    if (isAssetToPartsSync) return 'Sync to Parts'
    return 'Sync to Assets'
  }

  const getSyncDescription = () => {
    if (isAssetToPartsSync) {
      return `Sync ${bomItems} BOM items from asset "${assetName}" to parts inventory`
    } else {
      return `Sync ${linkedAssets} linked assets from part "${partName}" to asset BOM`
    }
  }

  const hasDataToSync = isAssetToPartsSync ? bomItems > 0 : linkedAssets > 0

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={!hasDataToSync}
          className="flex items-center gap-2"
        >
          {isAssetToPartsSync ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
          {getSyncButtonText()}
          {hasDataToSync && (
            <Badge variant="secondary" className="text-xs">
              {isAssetToPartsSync ? bomItems : linkedAssets}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            Synchronization
          </DialogTitle>
          <DialogDescription>
            {getSyncDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasDataToSync ? (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {isAssetToPartsSync 
                    ? 'No BOM items to sync' 
                    : 'No linked assets to sync'
                  }
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {isAssetToPartsSync ? 'Asset' : 'Part'}:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isAssetToPartsSync ? assetName : partName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Items to sync:</span>
                    <Badge variant="outline">
                      {isAssetToPartsSync ? bomItems : linkedAssets}
                    </Badge>
                  </div>
                </div>
              </div>

              {syncResult && (
                <div className={`p-4 border rounded-lg ${
                  syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {syncResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${
                        syncResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {syncResult.message}
                      </p>
                      {syncResult.data && (
                        <div className="text-xs space-y-1">
                          {syncResult.data.syncedItems !== undefined && (
                            <div>Synced: {syncResult.data.syncedItems}</div>
                          )}
                          {syncResult.data.skippedItems !== undefined && (
                            <div>Skipped: {syncResult.data.skippedItems}</div>
                          )}
                          {syncResult.data.errors && syncResult.data.errors.length > 0 && (
                            <div className="text-red-600">
                              Errors: {syncResult.data.errors.slice(0, 3).join(', ')}
                              {syncResult.data.errors.length > 3 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSyncing}
                >
                  {syncResult ? 'Close' : 'Cancel'}
                </Button>
                {!syncResult?.success && (
                  <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                  >
                    {getSyncIcon()}
                    {isSyncing ? 'Syncing...' : 'Start Sync'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
