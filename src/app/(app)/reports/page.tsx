
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp, Package, Layers, CalendarIcon, CalendarRange, Printer, ListChecks, CheckCircle, AlertTriangle, PoundSterling, LineChart as LineChartIcon } from "lucide-react";
import { AiInsights } from "@/components/reports/ai-insights";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, Line, PieChart, LineChart as RechartsLineChart } from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchReportDataAction, type ReportData } from './actions';
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from '@/components/ui/label';

// Chart Configs
const chartConfigSales = { sales: { label: "Sales (£)", color: "hsl(var(--primary))" }, orders: { label: "Orders", color: "hsl(var(--accent))"} };
const chartConfigServices = { value: { label: "Services" } }; // Colors handled dynamically
const chartConfigCategorySales = { sales: { label: "Sales (£)" } }; // Colors handled dynamically

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'Completed': return 'default'; 
    case 'Ready for Pickup': return 'secondary'; 
    case 'Received': case 'Processing': case 'Cleaning': case 'Alterations': return 'outline'; 
    case 'Cancelled': return 'destructive';
    default: return 'outline';
  }
}

export default function ReportsPage() {
  const { toast } = useToast();
  
  // Default to this month
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("This Month");

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const presets = useMemo(() => [
    { label: "This Week", range: { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: "Last Week", range: { start: startOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 }), end: endOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 }) } },
    { label: "This Month", range: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) } },
    { label: "Last Month", range: { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) } },
    { label: "This Year", range: { start: startOfYear(new Date()), end: endOfYear(new Date()) } },
  ], []);

  const handlePresetClick = (label: string, range: { start: Date; end: Date }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(label);
    setIsStartDatePickerOpen(false);
    setIsEndDatePickerOpen(false);
  };

  // Fetch Data when Dates Change
  useEffect(() => {
    async function loadReports() {
      if (!startDate || !endDate) return;
      
      setIsLoading(true);
      try {
        const data = await fetchReportDataAction(startDate, endDate);
        setReportData(data);
      } catch (error: any) {
        console.error("Failed to load reports:", error);
        toast({ title: "Error", description: error.message || "Failed to load report data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [startDate, endDate, toast]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-start print-hidden">
        <div>
            <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
            <p className="text-muted-foreground">Gain insights into your business performance.</p>
        </div>
        <Button onClick={handlePrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card className="shadow-md print-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-headline flex items-center text-lg"><CalendarRange className="mr-2 h-5 w-5" /> Date Range Selector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="grid grid-cols-2 gap-4 flex-1">
                <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                    <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" /> {startDate ? format(startDate, 'MMM dd, yyyy') : <span>Start Date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setIsStartDatePickerOpen(false); setActivePreset(""); }} initialFocus />
                    </PopoverContent>
                </Popover>
                <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                    <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" /> {endDate ? format(endDate, 'MMM dd, yyyy') : <span>End Date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={(date) => { setEndDate(date); setIsEndDatePickerOpen(false); setActivePreset(""); }} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-wrap gap-2">
                {presets.map(preset => (
                <Button key={preset.label} variant={activePreset === preset.label ? "default" : "secondary"} size="sm" onClick={() => handlePresetClick(preset.label, preset.range)}>
                    {preset.label}
                </Button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print-hidden">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">£{reportData?.summary.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{reportData?.summary.totalOrders}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">£{reportData?.summary.avgOrderValue.toFixed(2)}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Requiring Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-10" /> : (
                <>
                    <div className="text-2xl font-bold text-yellow-700">{reportData?.summary.ordersAttention}</div>
                    <p className="text-xs text-muted-foreground">Active orders not yet completed</p>
                </>
            )}
          </CardContent>
        </Card>
      </div>

      <AiInsights />

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChartIcon className="mr-2 h-5 w-5" /> Sales Trend</CardTitle>
            <CardDescription>Revenue over the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                 <ChartContainer config={chartConfigSales} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={reportData?.salesTrend || []}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `£${value}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                  </BarChart>
                </ChartContainer>
             )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><PieChartIcon className="mr-2 h-5 w-5" /> Top Services</CardTitle>
            <CardDescription>Most popular services by volume.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? <Skeleton className="h-[250px] w-[250px] rounded-full" /> : (
                <ChartContainer config={chartConfigServices} className="mx-auto aspect-square max-h-[250px]">
                <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={reportData?.topServices || []} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                    {reportData?.topServices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                </PieChart>
                </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Layers className="mr-2 h-5 w-5" /> Sales by Category</CardTitle>
            <CardDescription>Revenue breakdown by category.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                 <ChartContainer config={chartConfigCategorySales} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={reportData?.categorySales || []} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `£${value}`} />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" radius={4}>
                      {reportData?.categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
             )}
          </CardContent>
        </Card>

        {/* Recent Orders Table */}
        <Card className="shadow-md">
            <CardHeader>
            <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 h-5 w-5" /> Recent Orders</CardTitle>
            <CardDescription>Latest transactions in this period.</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                reportData?.recentOrders && reportData.recentOrders.length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number || order.orderNumber}</TableCell>
                            <TableCell>{order.customer_name || order.customerName}</TableCell>
                            <TableCell>£{order.total_amount?.toFixed(2) || order.totalAmount?.toFixed(2)}</TableCell>
                            <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : <p className="text-center text-muted-foreground py-4">No orders found for this period.</p>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
