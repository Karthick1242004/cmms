"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrialWarningDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TrialWarningDialog({ isOpen, onClose }: TrialWarningDialogProps) {
  const handleContactSales = () => {
    window.open('mailto:sales@voneautomation.com?subject=Trial%20Extension%20Request&body=My%20trial%20period%20has%20ended.%20I%20would%20like%20to%20discuss%20upgrading%20to%20a%20full%20license.', '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-center">
            Trial Period Has Ended
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Your trial period has expired. To continue using all features and adding new data, 
            please contact our sales team for further updates.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
              ⚠️ Please do not add any more data to the application
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              You can still view existing data
            </p>
          </div>

          <Button 
            onClick={handleContactSales} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Contact Sales
          </Button>

          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            View Existing Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

