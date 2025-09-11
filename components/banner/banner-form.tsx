"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useBannerStore } from "@/stores/banner-store"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Form validation schema
const bannerFormSchema = z.object({
  text: z.string()
    .min(1, 'Banner text is required')
    .max(200, 'Banner text must be less than 200 characters')
    .refine(
      (text) => text.trim().length > 0,
      'Banner text cannot be empty or just whitespace'
    ),
  priority: z.number()
    .min(1, 'Priority must be at least 1')
    .max(10, 'Priority cannot exceed 10'),
  isActive: z.boolean(),
})

type BannerFormData = z.infer<typeof bannerFormSchema>

export function BannerForm() {
  const { isAuthenticated } = useAuthStore()
  const { 
    currentBanner, 
    createBannerMessage, 
    updateBannerMessage, 
    setDialogOpen 
  } = useBannerStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!currentBanner

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      text: '',
      priority: 5,
      isActive: true,
    },
  })

  // Load banner data when editing
  useEffect(() => {
    if (currentBanner) {
      form.reset({
        text: currentBanner.text,
        priority: currentBanner.priority,
        isActive: currentBanner.isActive,
      })
    } else {
      form.reset({
        text: '',
        priority: 5,
        isActive: true,
      })
    }
  }, [currentBanner, form])

  const onSubmit = async (data: BannerFormData) => {
    // Check authentication before submitting
    if (!isAuthenticated) {
      toast.error('You must be logged in to create banner messages')
      return
    }

    setIsSubmitting(true)
    
    try {
      if (isEditing && currentBanner) {
        await updateBannerMessage(currentBanner.id, data)
      } else {
        await createBannerMessage(data)
      }
      
      // Form will be reset and dialog closed by the store actions
    } catch (error) {
      console.error('Error submitting banner form:', error)
      // Error toast is handled by the store
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Banner Text */}
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Message *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your announcement message here..."
                    className="min-h-[80px] resize-none"
                    {...field}
                  />
                </FormControl>
                <div className="text-xs text-gray-500">
                  {field.value?.length || 0}/200 characters
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority Level *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Below Normal</SelectItem>
                      <SelectItem value="4">4 - Normal</SelectItem>
                      <SelectItem value="5">5 - Medium</SelectItem>
                      <SelectItem value="6">6 - Above Normal</SelectItem>
                      <SelectItem value="7">7 - High</SelectItem>
                      <SelectItem value="8">8 - Very High</SelectItem>
                      <SelectItem value="9">9 - Critical</SelectItem>
                      <SelectItem value="10">10 - Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <div className="text-xs text-gray-500">
                  Higher priority messages appear first in the banner rotation
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <div className="text-sm text-gray-500">
                    Control whether this banner is displayed to users
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Banner Guidelines</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Keep messages concise and clear</li>
              <li>• Use appropriate priority levels (emergency for urgent company-wide notices)</li>
              <li>• Higher priority messages will appear first in the rotation</li>
              <li>• Only active banners will be displayed to users</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Banner' : 'Create Banner'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
