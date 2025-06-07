"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, Package } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CustomFeaturePage() {
  const params = useParams()
  const slug = params.slug as string

  // This would normally fetch the feature definition from a store or API
  // For now, we'll show a placeholder page

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>
              <p className="text-muted-foreground">Custom feature: /{slug}</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Record
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <Package className="h-4 w-4" />
        <AlertDescription>
          This is a dynamically created page for the custom feature "{slug}". In a full implementation, this page would
          render based on the feature definition created in the Feature Builder, displaying the configured fields and UI
          components.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>Manage your {slug.replace(/-/g, " ")} records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">#001</TableCell>
                <TableCell>Sample Record</TableCell>
                <TableCell>
                  <Badge variant="outline">Active</Badge>
                </TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No more records found. This is a demo page for the custom feature.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
