"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBannerStore } from "@/stores/banner-store"
import { BannerForm } from "./banner-form"
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  MessageSquare,
  Loader2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export function BannerManagement() {
  const { isAuthenticated } = useAuthStore()
  const {
    bannerMessages,
    isLoading,
    isDialogOpen,
    currentBanner,
    fetchBannerMessages,
    deleteBannerMessage,
    toggleBannerStatus,
    setDialogOpen,
    setEditBanner,
  } = useBannerStore()

  useEffect(() => {
    // Only fetch banners if user is authenticated
    if (isAuthenticated) {
      fetchBannerMessages()
    }
  }, [fetchBannerMessages, isAuthenticated])

  const handleDeleteBanner = async (id: string, text: string) => {
    if (window.confirm(`Are you sure you want to delete the banner message: "${text}"? This action cannot be undone.`)) {
      try {
        await deleteBannerMessage(id)
      } catch (error) {
        console.error('Failed to delete banner:', error)
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBannerStatus(id, !currentStatus)
    } catch (error) {
      console.error('Failed to toggle banner status:', error)
    }
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 9) return { label: "Emergency", color: "bg-red-100 text-red-800 border-red-200" }
    if (priority >= 7) return { label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" }
    if (priority >= 5) return { label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    return { label: "Low", color: "bg-blue-100 text-blue-800 border-blue-200" }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading banner messages...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Banner Management</h3>
          <p className="text-sm text-gray-600">
            Manage rotating banner messages displayed at the top of the application
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Banner List */}
      {bannerMessages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Banner Messages</h3>
              <p className="text-gray-500 mb-4">
                Create your first banner message to display announcements to all users.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bannerMessages.map((banner) => {
            const priorityInfo = getPriorityLabel(banner.priority)
            
            return (
              <Card key={banner.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={priorityInfo.color}>
                          {banner.priority >= 9 && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {priorityInfo.label} ({banner.priority})
                        </Badge>
                        <Badge 
                          variant={banner.isActive ? "default" : "secondary"}
                          className={banner.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardTitle className="text-base leading-relaxed">
                        {banner.text}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                        title={banner.isActive ? "Deactivate banner" : "Activate banner"}
                      >
                        {banner.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditBanner(banner)}
                        title="Edit banner"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id, banner.text)}
                        title="Delete banner"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      Created by <strong>{banner.createdByName}</strong>
                    </div>
                    <div>
                      {formatDistanceToNow(new Date(banner.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentBanner ? 'Edit Banner Message' : 'Create Banner Message'}
            </DialogTitle>
          </DialogHeader>
          <BannerForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
