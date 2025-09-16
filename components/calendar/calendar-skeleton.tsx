'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Calendar Controls Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid Skeleton */}
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-muted p-3 text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="bg-background p-2 min-h-24 space-y-1">
                  <Skeleton className="h-4 w-6" />
                  {/* Some cells have events */}
                  {i % 3 === 0 && (
                    <>
                      <Skeleton className="h-5 w-full" />
                      {i % 6 === 0 && <Skeleton className="h-5 w-3/4" />}
                    </>
                  )}
                  {i % 5 === 0 && <Skeleton className="h-5 w-5/6" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
