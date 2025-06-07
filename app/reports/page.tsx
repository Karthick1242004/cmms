"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month")

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze maintenance data and generate insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export Report</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,685</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.5%</span> from previous period
                </p>
                <div className="mt-4 h-36 bg-muted/50 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Cost Trend Chart</span>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Work Order Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">-3.2%</span> from previous period
                </p>
                <div className="mt-4 h-36 bg-muted/50 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Completion Rate Chart</span>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Asset Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.3%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+1.7%</span> from previous period
                </p>
                <div className="mt-4 h-36 bg-muted/50 rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Uptime Chart</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Maintenance Overview</CardTitle>
              <CardDescription>Comprehensive view of maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted/50 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Maintenance Overview Chart</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Preventive
                </Badge>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  Corrective
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Predictive
                </Badge>
              </div>
              <Button variant="outline">View Details</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Performance</CardTitle>
              <CardDescription>Analysis of asset performance and reliability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted/50 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Asset Performance Chart</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Metrics</CardTitle>
              <CardDescription>Key performance indicators for maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted/50 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Maintenance Metrics Chart</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>Stock levels and inventory turnover metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted/50 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Inventory Analysis Chart</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
