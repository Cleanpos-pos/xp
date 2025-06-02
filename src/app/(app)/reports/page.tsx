
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Package, Layers } from "lucide-react"; // Added Package, Layers
import { AiInsights } from "@/components/reports/ai-insights";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, Line, PieChart, LineChart, Tooltip as RechartsTooltip } from "recharts" // Added RechartsTooltip for custom tooltip on new charts

const chartDataSales = [
  { month: "January", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "February", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "March", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "April", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "May", sales: Math.floor(Math.random() * 5000) + 1000 },
  { month: "June", sales: Math.floor(Math.random() * 5000) + 1000 },
];

const chartDataServices = [
  { name: "Dry Cleaning", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Laundry", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Alterations", value: 200, fill: "hsl(var(--chart-3))" },
  { name: "Specialty", value: 100, fill: "hsl(var(--chart-4))" },
];

// New mock data for category and item reports
const chartDataCategorySales = [
  { category: "Dry Cleaning", sales: 2850, fill: "hsl(var(--chart-1))" },
  { category: "Laundry", sales: 1750, fill: "hsl(var(--chart-2))" },
  { category: "Alterations", sales: 950, fill: "hsl(var(--chart-3))" },
  { category: "Specialty Items", sales: 1350, fill: "hsl(var(--chart-4))" },
  { category: "Shoe Repair", sales: 650, fill: "hsl(var(--chart-5))" },
];

const chartDataItemSales = [
  { item: "Men's Suit", sales: 1200, fill: "hsl(var(--primary))" },
  { item: "Silk Dress", sales: 950, fill: "hsl(var(--accent))" },
  { item: "Shirt Laundry", sales: 700, fill: "hsl(var(--secondary))" },
  { item: "Trouser Hemming", sales: 450, fill: "hsl(var(--chart-1))" },
  { item: "Comforter Clean", sales: 880, fill: "hsl(var(--chart-2))" },
];


const chartConfigSales = {
  sales: {
    label: "Sales ($)",
    color: "hsl(var(--primary))",
  },
   orders: { label: "Orders" }, // For Order Volume
};

const chartConfigServices = {
  value: { label: "Services" },
  "Dry Cleaning": { label: "Dry Cleaning", color: "hsl(var(--chart-1))" },
  Laundry: { label: "Laundry", color: "hsl(var(--chart-2))" },
  Alterations: { label: "Alterations", color: "hsl(var(--chart-3))" },
  Specialty: { label: "Specialty", color: "hsl(var(--chart-4))" },
};

const chartConfigCategorySales = {
  sales: { label: "Sales ($)" },
  "Dry Cleaning": { label: "Dry Cleaning", color: "hsl(var(--chart-1))" },
  Laundry: { label: "Laundry", color: "hsl(var(--chart-2))" },
  Alterations: { label: "Alterations", color: "hsl(var(--chart-3))" },
  "Specialty Items": { label: "Specialty Items", color: "hsl(var(--chart-4))" },
  "Shoe Repair": { label: "Shoe Repair", color: "hsl(var(--chart-5))" },
};

const chartConfigItemSales = {
  sales: { label: "Sales ($)" },
  "Men's Suit": { label: "Men's Suit", color: "hsl(var(--primary))" },
  "Silk Dress": { label: "Silk Dress", color: "hsl(var(--accent))" },
  "Shirt Laundry": { label: "Shirt Laundry", color: "hsl(var(--secondary))" },
  "Trouser Hemming": { label: "Trouser Hemming", color: "hsl(var(--chart-1))" },
  "Comforter Clean": { label: "Comforter Clean", color: "hsl(var(--chart-2))" },
};


export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Gain insights into your business performance.
        </p>
      </div>

      <AiInsights />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5" /> Monthly Sales Overview
            </CardTitle>
            <CardDescription>Track your sales performance over time.</CardDescription>
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
            <CardDescription>Distribution of services availed by customers (by count).</CardDescription>
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
            <CardDescription>Breakdown of revenue by service category.</CardDescription>
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
            <CardDescription>Revenue generated by individual popular items.</CardDescription>
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
          <CardDescription>Monitor the number of orders over the past weeks.</CardDescription>
        </CardHeader>
        <CardContent>
           <ChartContainer config={chartConfigSales} className="h-[300px] w-full">
              <LineChart accessibilityLayer data={chartDataSales.map(d => ({...d, orders: Math.floor(d.sales / 50)})) } margin={{ left: 12, right: 12 }}>
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
              </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
