
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import Image from "next/image";
import { AiInsights } from "@/components/reports/ai-insights";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, Cell, Line, PieChart, LineChart } from "recharts"

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

const chartConfigSales = {
  sales: {
    label: "Sales ($)",
    color: "hsl(var(--primary))",
  },
};

const chartConfigServices = {
  value: {
    label: "Services",
  },
  "Dry Cleaning": { label: "Dry Cleaning", color: "hsl(var(--chart-1))" },
  Laundry: { label: "Laundry", color: "hsl(var(--chart-2))" },
  Alterations: { label: "Alterations", color: "hsl(var(--chart-3))" },
  Specialty: { label: "Specialty", color: "hsl(var(--chart-4))" },
}


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
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" /> Service Popularity
            </CardTitle>
            <CardDescription>Distribution of services availed by customers.</CardDescription>
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
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                 <Line dataKey="orders" type="monotone" stroke="var(--color-sales)" strokeWidth={2} dot={true} />
              </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
