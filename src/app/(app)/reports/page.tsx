
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Package, Layers, CalendarIcon, CalendarRange, Printer, ListChecks, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { AiInsights } from "@/components/reports/ai-insights";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, PieChart } from "recharts"
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfQuarter, 
  endOfQuarter, 
  subQuarters, 
  startOfYear, 
  endOfYear
} from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, Order } from '@/types';
import { getSalesOverview, getServicePopularity, getCategorySales, getOrdersForReport } from './report-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

// Chart Configs
const chartConfigSales = { sales: { label: "Sales (£)", color: "hsl(var(--primary))" }, orders: { label: "Orders", color: "hsl(var(--accent))"} };
const chartConfigServices = { count: { label: "Services" } };
const chartConfigCategorySales = { sales: { label: "Sales (£)" } };


function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'Completed': return 'default'; 
    case 'Ready for Pickup': return 'secondary'; 
    case 'Cleaning': case 'Alterations': case 'Processing': case 'Received': return 'outline'; 
    case 'Cancelled': return 'destructive';
    default: return 'outline';
  }
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [activePreset, setActivePreset] = useState<string>("This Month");

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    salesOverview: any[];
    servicePopularity: any[];
    categorySales: any[];
    keyOrders: Order[];
  }>({
    salesOverview: [],
    servicePopularity: [],
    categorySales: [],
    keyOrders: [],
  });

  const presets = useMemo(() => [
    { label: "This Week", range: { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: "This Month", range: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) } },
    { label: "Last Month", range: { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) } },
    { label: "This Quarter", range: { start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) } },
    { label: "Last Quarter", range: { start: startOfQuarter(subQuarters(new Date(), 1)), end: endOfQuarter(subQuarters(new Date(), 1)) } },
    { label: "This Year", range: { start: startOfYear(new Date()), end: endOfYear(new Date()) } },
  ], []);

  const handlePresetClick = (label: string, range: { start: Date; end: Date }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(label);
  };

  const fetchReports = useCallback(async (start?: Date, end?: Date) => {
    if (!start || !end) return;
    setIsLoading(true);
    try {
      const [salesData, popularityData, categoryData, ordersData] = await Promise.all([
        getSalesOverview(start, end),
        getServicePopularity(start, end),
        getCategorySales(start, end),
        getOrdersForReport(start, end)
      ]);
      setReportData({
        salesOverview: salesData,
        servicePopularity: popularityData,
        categorySales: categoryData,
        keyOrders: ordersData,
      });
    } catch (error: any) {
      console.error("Failed to fetch report data:", error.message || error);
      toast({ title: "Error", description: "Could not load report data from the database.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  

  useEffect(() => {
    fetchReports(startDate, endDate);
  }, [startDate, endDate, fetchReports]);


  const handlePrintReport = () => {
    window.print();
  };

  const summaryStats = useMemo(() => {
    const totalSales = reportData.salesOverview.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = reportData.salesOverview.reduce((sum, item) => sum + item.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const ordersRequiringAttention = reportData.keyOrders.filter(o => o.status !== 'Completed' && o.status !== 'Ready for Pickup' && o.status !== 'Cancelled').length;
    
    return { totalSales, totalOrders, avgOrderValue, ordersRequiringAttention };
  }, [reportData]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start print-hidden">
        <div>
            <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
            <p className="text-muted-foreground">
            Gain insights into your business performance from real data.
            </p>
        </div>
        <Button onClick={handlePrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </div>

      <Card className="shadow-md print-hidden">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <CalendarRange className="mr-2 h-5 w-5" /> Date Range Selector
          </CardTitle>
          <CardDescription>Select a period to view reports for. Default is this month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="startDateReport" className="text-sm font-medium">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="startDateReport" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date || undefined); setActivePreset(""); }} disabled={(date) => endDate ? date > endDate : false} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDateReport" className="text-sm font-medium">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="endDateReport" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={(date) => { setEndDate(date || undefined); setActivePreset(""); }} disabled={(date) => startDate ? date < startDate : false}/>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {presets.map(preset => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset.label, preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print-hidden">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /></CardHeader>
                    <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print-hidden">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">£{summaryStats.totalSales.toLocaleString(undefined, {maximumFractionDigits:0})}</div></CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{summaryStats.totalOrders.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">£{summaryStats.avgOrderValue.toFixed(2)}</div></CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Requiring Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryStats.ordersRequiringAttention}</div>
                <p className="text-xs text-muted-foreground">Orders not yet ready or completed.</p>
            </CardContent>
            </Card>
        </div>
      )}

      <AiInsights />

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
      <>
        <Card className="shadow-md">
            <CardHeader>
            <CardTitle className="font-headline flex items-center">
                <ListChecks className="mr-2 h-5 w-5" /> Orders in Selected Period
            </CardTitle>
            <CardDescription>A list of all orders within the selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
            {reportData.keyOrders.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.keyOrders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>£{order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-4">No orders found for this period.</p>
            )}
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center">
                    <BarChartIcon className="mr-2 h-5 w-5" /> Sales & Order Volume
                    </CardTitle>
                    <CardDescription>Sales and order count grouped by time interval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfigSales} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={reportData.salesOverview}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" tickFormatter={(value) => `£${value / 1000}k`}/>
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend />
                        <Bar yAxisId="left" dataKey="sales" fill="var(--color-sales)" radius={4} />
                        <Bar yAxisId="right" dataKey="orders" fill="var(--color-orders)" radius={4} />
                    </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center">
                    <PieChartIcon className="mr-2 h-5 w-5" /> Service Popularity
                    </CardTitle>
                    <CardDescription>Distribution of services by number of items sold.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ChartContainer config={chartConfigServices} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={reportData.servicePopularity} dataKey="count" nameKey="serviceName" innerRadius={60} strokeWidth={5}>
                        {reportData.servicePopularity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                        ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="serviceName" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                    </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                <Layers className="mr-2 h-5 w-5" /> Sales by Category
                </CardTitle>
                <CardDescription>Breakdown of revenue by service category.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfigCategorySales} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={reportData.categorySales} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `£${value / 1000}k`} />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" radius={4}>
                    {reportData.categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                    ))}
                    </Bar>
                </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </>
      )}
    </div>
  );
}
