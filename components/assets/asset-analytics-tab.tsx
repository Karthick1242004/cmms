"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Activity,
  Zap,
  Timer,
  RotateCcw,
  Wrench
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { assetAnalyticsApi } from '@/lib/asset-analytics-api';
import { formatDowntime } from '@/lib/downtime-utils';
import { 
  getDateRangeForPreset, 
  formatAnalyticsPreset 
} from '@/lib/asset-analytics-utils';
import type { 
  AssetAnalytics, 
  AnalyticsPreset
} from '@/types/asset-analytics';
import { ANALYTICS_PRESETS } from '@/types/asset-analytics';

interface AssetAnalyticsTabProps {
  assetId: string;
  assetName: string;
}

const CHART_COLORS = {
  uptime: '#10B981',      // Green
  downtime: '#EF4444',    // Red
  planned: '#3B82F6',     // Blue
  unplanned: '#F59E0B',   // Orange
  availability: '#8B5CF6' // Purple
};

const PIE_COLORS = ['#3B82F6', '#EF4444']; // Blue for planned, Red for unplanned

export function AssetAnalyticsTab({ assetId, assetName }: AssetAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AssetAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<AnalyticsPreset>('last_30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let filters: any = {};

      if (selectedPreset === 'custom') {
        if (!customStartDate || !customEndDate) {
          setError('Please select both start and end dates for custom range');
          setIsLoading(false);
          return;
        }
        filters = {
          startDate: customStartDate,
          endDate: customEndDate
        };
      } else {
        filters = { preset: selectedPreset };
      }

      const response = await assetAnalyticsApi.getAssetAnalytics(assetId, filters);

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.error || response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [assetId, selectedPreset]);

  const handlePresetChange = (preset: AnalyticsPreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomDateApply = () => {
    if (selectedPreset === 'custom') {
      fetchAnalytics();
    }
  };

  // Prepare chart data
  const chartData = analytics?.trends.map(trend => ({
    date: format(parseISO(trend.date), 'MMM dd'),
    uptime: Math.round((trend.totalUptimeMinutes / 60) * 100) / 100,
    downtime: Math.round((trend.totalDowntimeMinutes / 60) * 100) / 100,
    plannedDowntime: Math.round((trend.plannedDowntimeMinutes / 60) * 100) / 100,
    unplannedDowntime: Math.round((trend.unplannedDowntimeMinutes / 60) * 100) / 100,
    availability: trend.availability,
    incidents: trend.numberOfIncidents
  })) || [];

  const availabilityData = analytics?.trends.map(trend => ({
    date: format(parseISO(trend.date), 'MMM dd'),
    availability: trend.availability
  })) || [];

  const downtimeBreakdownData = analytics ? [
    { name: 'Planned', value: analytics.downtimeBreakdown.planned.total, count: analytics.downtimeBreakdown.planned.incidents },
    { name: 'Unplanned', value: analytics.downtimeBreakdown.unplanned.total, count: analytics.downtimeBreakdown.unplanned.incidents }
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-sm">No downtime data available for the selected period.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Uptime & Downtime Analytics</h3>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(analytics.analysisPeriod.startDate), 'MMM dd, yyyy')} - {format(parseISO(analytics.analysisPeriod.endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ANALYTICS_PRESETS).map(preset => (
                <SelectItem key={preset} value={preset}>
                  {formatAnalyticsPreset(preset)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPreset === 'custom' && (
            <>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40"
              />
              <Button onClick={handleCustomDateApply} size="sm">
                Apply
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overall Availability</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.summary.overallAvailability.toFixed(1)}%
                  </p>
                  <TrendingUp className="h-4 w-4 ml-1 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Downtime</p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.summary.totalDowntimeHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.summary.totalIncidents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">MTTR</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.summary.mttr.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planned Downtime</p>
                <p className="text-lg font-semibold text-blue-600">
                  {analytics.summary.plannedDowntimeHours.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unplanned Downtime</p>
                <p className="text-lg font-semibold text-orange-600">
                  {analytics.summary.unplannedDowntimeHours.toFixed(1)}h
                </p>
              </div>
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MTBF</p>
                <p className="text-lg font-semibold text-green-600">
                  {analytics.summary.mtbf.toFixed(1)}h
                </p>
              </div>
              <RotateCcw className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Incident Duration</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatDowntime(analytics.summary.averageIncidentDuration)}
                </p>
              </div>
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime vs Downtime Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Uptime vs Downtime (Hours)</CardTitle>
            <CardDescription>Track daily operational performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uptime" fill={CHART_COLORS.uptime} name="Uptime (h)" />
                <Bar dataKey="downtime" fill={CHART_COLORS.downtime} name="Downtime (h)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Availability Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Availability Trend</CardTitle>
            <CardDescription>Percentage availability over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={availabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Availability']} />
                <Line 
                  type="monotone" 
                  dataKey="availability" 
                  stroke={CHART_COLORS.availability} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.availability }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Planned vs Unplanned Downtime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Planned vs Unplanned Downtime</CardTitle>
            <CardDescription>Breakdown of downtime types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={downtimeBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) => `${name}: ${formatDowntime(value)} (${count} incidents)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {downtimeBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatDowntime(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
            <CardDescription>Key metrics breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Planned Downtime</span>
                  <Badge variant="outline" className="text-blue-600">
                    {analytics.downtimeBreakdown.planned.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unplanned Downtime</span>
                  <Badge variant="outline" className="text-red-600">
                    {analytics.downtimeBreakdown.unplanned.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Operational Hours</span>
                  <span className="text-sm font-medium">
                    {analytics.summary.totalOperationalHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Analysis Period</span>
                  <span className="text-sm font-medium">
                    {analytics.analysisPeriod.totalDays} days
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      {analytics.incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Downtime Incidents</CardTitle>
            <CardDescription>Latest downtime incidents for this asset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={incident.type === 'planned' ? 'secondary' : 'destructive'}>
                        {incident.type}
                      </Badge>
                      <Badge variant="outline">
                        {incident.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(incident.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{incident.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.startTime} - {incident.endTime} • Attended by: {incident.attendedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDowntime(incident.duration)}
                    </p>
                    <p className="text-xs text-muted-foreground">{incident.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
