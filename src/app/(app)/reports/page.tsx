
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Package, Layers, CalendarIcon, CalendarRange } from "lucide-react"; // Added CalendarRange
import { AiInsights } from "@/components/reports/ai-insights";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, Line, PieChart, LineChart as RechartsLineChart, Tooltip as RechartsTooltip } from "recharts"
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
  endOfYear, 
  subYears,
  isSameDay
} from 'date-fns';

// Initial Chart Data (will be "updated" by useEffect based on date range)
const initialChartDataSales = [
  { month: "January", sales: 0, orders: 0 }, { month: "February", sales: 0, orders: 0 }, { month: "March", sales: 0, orders: 0 },
  { month: "April", sales: 0, orders: 0 }, { month: "May", sales: 0, orders: 0 }, { month: "June", sales: 0, orders: 0 },
];
const initialChartDataServices = [
  { name: "Dry Cleaning", value: 0, fill: "hsl(var(--chart-1))" }, { name: "Laundry", value: 0, fill: "hsl(var(--chart-2))" },
  { name: "Alterations", value: 0, fill: "hsl(var(--chart-3))" }, { name: "Specialty", value: 0, fill: "hsl(var(--chart-4))" },
];
const initialChartDataCategorySales = [
  { category: "Dry Cleaning", sales: 0, fill: "hsl(var(--chart-1))" }, { category: "Laundry", sales: 0, fill: "hsl(var(--chart-2))" },
  { category: "Alterations", sales: 0, fill: "hsl(var(--chart-3))" }, { category: "Specialty Items", sales: 0, fill: "hsl(var(--chart-4))" },
  { category: "Shoe Repair", sales: 0, fill: "hsl(var(--chart-5))" },
];
const initialChartDataItemSales = [
  { item: "Men's Suit", sales: 0, fill: "hsl(var(--primary))" }, { item: "Silk Dress", sales: 0, fill: "hsl(var(--accent))" },
  { item: "Shirt Laundry", sales: 0, fill: "hsl(var(--secondary))" }, { item: "Trouser Hemming", sales: 0, fill: "hsl(var(--chart-1))" },
  { item: "Comforter Clean", sales: 0, fill: "hsl(var(--chart-2))" },
];

const chartConfigSales = { sales: { label: "Sales ($)", color: "hsl(var(--primary))" }, orders: { label: "Orders", color: "hsl(var(--accent))"} };
const chartConfigServices = { value: { label: "Services" }, "Dry Cleaning": { label: "Dry Cleaning", color: "hsl(var(--chart-1))" }, Laundry: { label: "Laundry", color: "hsl(var(--chart-2))" }, Alterations: { label: "Alterations", color: "hsl(var(--chart-3))" }, Specialty: { label: "Specialty", color: "hsl(var(--chart-4))" }};
const chartConfigCategorySales = { sales: { label: "Sales ($)" }, "Dry Cleaning": { label: "Dry Cleaning", color: "hsl(var(--chart-1))" }, Laundry: { label: "Laundry", color: "hsl(var(--chart-2))" }, Alterations: { label: "Alterations", color: "hsl(var(--chart-3))" }, "Specialty Items": { label: "Specialty Items", color: "hsl(var(--chart-4))" }, "Shoe Repair": { label: "Shoe Repair", color: "hsl(var(--chart-5))" } };
const chartConfigItemSales = { sales: { label: "Sales ($)" }, "Men's Suit": { label: "Men's Suit", color: "hsl(var(--primary))" }, "Silk Dress": { label: "Silk Dress", color: "hsl(var(--accent))" }, "Shirt Laundry": { label: "Shirt Laundry", color: "hsl(var(--secondary))" }, "Trouser Hemming": { label: "Trouser Hemming", color: "hsl(var(--chart-1))" }, "Comforter Clean": { label: "Comforter Clean", color: "hsl(var(--chart-2))" } };


export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("This Month");

  const [chartDataSales, setChartDataSales] = useState(initialChartDataSales);
  const [chartDataServices, setChartDataServices] = useState(initialChartDataServices);
  const [chartDataCategorySales, setChartDataCategorySales] = useState(initialChartDataCategorySales);
  const [chartDataItemSales, setChartDataItemSales] = useState(initialChartDataItemSales);

  const presets = useMemo(() => [
    { label: "This Week", range: { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: "Last Week", range: { start: startOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 }), end: endOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 }) } },
    { label: "This Month", range: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) } },
    { label: "Last Month", range: { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) } },
    { label: "This Quarter", range: { start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) } },
    { label: "Last Quarter", range: { start: startOfQuarter(subQuarters(new Date(), 1)), end: endOfQuarter(subQuarters(new Date(), 1)) } },
    { label: "This Year", range: { start: startOfYear(new Date()), end: endOfYear(new Date()) } },
    { label: "Last Year", range: { start: startOfYear(subYears(new Date(), 1)), end: endOfYear(subYears(new Date(), 1)) } },
  ], []);

  const handlePresetClick = (label: string, range: { start: Date; end: Date }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(label);
    setIsStartDatePickerOpen(false);
    setIsEndDatePickerOpen(false);
  };

  // Simulate data update when date range changes
  useEffect(() => {
    console.log("Date range changed, simulating data update:", startDate, endDate);
    // For Monthly Sales & Order Volume
    setChartDataSales(initialChartDataSales.map(d => ({
      ...d,
      sales: Math.floor(Math.random() * 4000) + 500, // Random sales between 500-4500
      orders: Math.floor(Math.random() * 100) + 20 // Random orders between 20-120
    })));
    // For Service Popularity
    setChartDataServices(initialChartDataServices.map(s => ({
      ...s,
      value: Math.floor(Math.random() * 300) + 50 // Random value between 50-350
    })));
    // For Sales by Category
    setChartDataCategorySales(initialChartDataCategorySales.map(c => ({
      ...c,
      sales: Math.floor(Math.random() * 2000) + 300 // Random sales between 300-2300
    })));
    // For Top Selling Items
    setChartDataItemSales(initialChartDataItemSales.map(i => ({
      ...i,
      sales: Math.floor(Math.random() * 1000) + 100 // Random sales between 100-1100
    })));
  }, [startDate, endDate]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Gain insights into your business performance.
        </p>
      </div>

      {/* Date Range Selector Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <CalendarRange className="mr-2 h-5 w-5" /> Date Range Selector
          </CardTitle>
          <CardDescription>Select a period to view reports for. Default is this month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="startDate" className="text-sm font-medium">From</label>
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => { setStartDate(date); setIsStartDatePickerOpen(false); setActivePreset(""); }}
                    initialFocus
                    disabled={(date) => endDate ? date > endDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label htmlFor="endDate" className="text-sm font-medium">To</label>
              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => { setEndDate(date); setIsEndDatePickerOpen(false); setActivePreset(""); }}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
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
      {/* End Date Range Selector Card */}

      <AiInsights />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5" /> Monthly Sales Overview
            </CardTitle>
            <CardDescription>Track your sales performance over time. (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigSales} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartDataSales}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" /> Service Popularity Mix
            </CardTitle>
            <CardDescription>Distribution of services availed by customers (by count). (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={chartConfigServices} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartDataServices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                   {chartDataServices.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Layers className="mr-2 h-5 w-5" /> Sales by Category
            </CardTitle>
            <CardDescription>Breakdown of revenue by service category. (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigCategorySales} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartDataCategorySales} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" radius={4}>
                  {chartDataCategorySales.map((entry) => (
                    <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Package className="mr-2 h-5 w-5" /> Top Selling Items/Services
            </CardTitle>
            <CardDescription>Revenue generated by individual popular items. (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfigItemSales} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartDataItemSales} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                <YAxis dataKey="item" type="category" tickLine={false} axisLine={false} width={100}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                 <Bar dataKey="sales" radius={4}>
                  {chartDataItemSales.map((entry) => (
                    <Cell key={`cell-${entry.item}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <LineChartIcon className="mr-2 h-5 w-5" /> Order Volume Trend
          </CardTitle>
          <CardDescription>Monitor the number of orders over the past weeks. (Mock Data)</CardDescription>
        </CardHeader>
        <CardContent>
           <ChartContainer config={chartConfigSales} className="h-[300px] w-full">
              <RechartsLineChart accessibilityLayer data={chartDataSales} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis dataKey="orders"/>
                <ChartTooltip content={<ChartTooltipContent indicator="line"/>} />
                 <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={{fill: "var(--color-orders)"}} activeDot={{r:6}} />
              </RechartsLineChart>
            </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}

    