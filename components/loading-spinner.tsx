import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Cog, Wrench } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="h-full flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm">
      <div className="flex flex-col items-center space-y-6 p-8">
        {/* Animated Icons */}
        <div className="relative">
          <div className="absolute inset-0 animate-spin">
            <Cog className="h-12 w-12 text-primary/30" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "3s" }}
          >
            <Wrench className="h-8 w-8 text-primary/50 ml-2 mt-2" />
          </div>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Loading CMMS</h3>
          <p className="text-sm text-muted-foreground animate-pulse">Please wait while we prepare your dashboard...</p>
        </div>

        {/* Loading Progress */}
        <div className="w-64 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Initializing...</span>
              <span className="animate-pulse">●●●</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>

          {/* Skeleton Cards */}
          <div className="grid gap-3 mt-6">
            <Card className="w-64">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-64">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
