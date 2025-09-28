"use client"

import { ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// Helper function to render maintenance chart based on type
export const renderMaintenanceChart = (type: 'bar' | 'pie' | 'line', data: any[]) => {
  switch (type) {
    case 'bar':
      return (
        <RechartsBarChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      )
    case 'line':
      return (
        <RechartsLineChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#06b6d4" 
            strokeWidth={3}
            dot={{ fill: "#06b6d4", r: 4 }}
          />
        </RechartsLineChart>
      )
    case 'pie':
    default:
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} tasks`, '']}
          />
        </RechartsPieChart>
      )
  }
}

// Helper function to render asset performance chart based on type
export const renderAssetChart = (type: 'pie' | 'bar' | 'donut', data: any[]) => {
  switch (type) {
    case 'bar':
      return (
        <RechartsBarChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      )
    case 'donut':
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} assets`, '']}
          />
        </RechartsPieChart>
      )
    case 'pie':
    default:
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} assets`, '']}
          />
        </RechartsPieChart>
      )
  }
}

// Helper function to render maintenance metrics chart based on type
export const renderMetricsChart = (type: 'pie' | 'bar' | 'area', data: any[]) => {
  switch (type) {
    case 'bar':
      return (
        <RechartsBarChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      )
    case 'area':
      return (
        <AreaChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </AreaChart>
      )
    case 'pie':
    default:
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}${name.includes('MTTR') || name.includes('MTBF') ? 'hrs' : '%'}`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value, name) => [
              `${value}${String(name).includes('MTTR') || String(name).includes('MTBF') ? ' hrs' : '%'}`, 
              name
            ]}
          />
        </RechartsPieChart>
      )
  }
}

// Helper function to render inventory chart based on type
export const renderInventoryChart = (type: 'donut' | 'pie' | 'bar', data: any[]) => {
  switch (type) {
    case 'bar':
      return (
        <RechartsBarChart data={data} height={250}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" fontSize={10} />
          <YAxis fontSize={10} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      )
    case 'pie':
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} units`, '']}
          />
        </RechartsPieChart>
      )
    case 'donut':
    default:
      return (
        <RechartsPieChart width={300} height={250}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            dataKey="value"
            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} units`, '']}
          />
        </RechartsPieChart>
      )
  }
}

// Chart rendering functions for parts
export const renderPartsChart = (chartType: 'bar' | 'pie' | 'line', data: any[], reportData?: any) => {
  const partsData = reportData?.parts?.byCategory || data

  switch (chartType) {
    case 'bar':
      return (
        <RechartsBarChart data={partsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      )
    case 'pie':
      return (
        <RechartsPieChart>
          <Pie
            data={partsData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage }) => `${category}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {partsData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </RechartsPieChart>
      )
    default:
      return (
        <RechartsBarChart data={partsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      )
  }
}

// Chart rendering functions for transactions
export const renderTransactionsChart = (chartType: 'line' | 'bar' | 'area', data: any[], reportData?: any) => {
  const transactionData = reportData?.transactions?.volumeTrend || data

  switch (chartType) {
    case 'line':
      return (
        <RechartsLineChart data={transactionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line 
            type="monotone" 
            dataKey="volume" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Volume"
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Value ($)"
          />
        </RechartsLineChart>
      )
    case 'bar':
      return (
        <RechartsBarChart data={transactionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="volume" fill="#3b82f6" name="Volume" />
          <Bar dataKey="value" fill="#10b981" name="Value ($)" />
        </RechartsBarChart>
      )
    case 'area':
      return (
        <AreaChart data={transactionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stackId="1"
            stroke="#3b82f6" 
            fill="#3b82f6"
            name="Volume"
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stackId="2"
            stroke="#10b981" 
            fill="#10b981"
            name="Value ($)"
          />
        </AreaChart>
      )
    default:
      return (
        <RechartsLineChart data={transactionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} />
        </RechartsLineChart>
      )
  }
}
