"use client"

import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { PartsListTable } from "@/components/parts-list-table"
import { sampleParts } from "@/data/parts-sample"
import { useAuthStore } from "@/stores/auth-store"

// Note: For a real "Add Part" functionality, you'd typically have another dialog
// similar to the edit dialog but for creating a new part and adding it to the local state.
// For brevity, I'm focusing on the requested edit, adjust stock, and delete.

export default function PartsPage() {
  // In a real app, you might fetch initialParts or manage them in a global store.
  // Here, we pass the sample data directly. The PartsListTable will manage its own state copy.

  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  return (
    <PageLayout>
      <PageHeader>
        <div className="space-y-6 animate-fade-in p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Parts & Inventory</h1>
              <p className="text-muted-foreground">Manage your spare parts and inventory levels.</p>
            </div>
          </div>
        </div>
      </PageHeader>
      <div className="animate-fade-in px-6">
        <PageContent>
          <PartsListTable initialParts={sampleParts} showAddButton={isAdmin} />
        </PageContent>
      </div>
    </PageLayout>
  )
}
