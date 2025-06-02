
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ListChecks, Users, ShoppingBag, Briefcase, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const summaryStats = [
    { title: "Today's Revenue", value: "$1,250", icon: DollarSign, description: "+15% from yesterday", color: "text-green-500" },
    { title: "Orders Pending", value: "23", icon: ListChecks, description: "5 new orders today", color: "text-yellow-500" },
    { title: "Active Customers", value: "150", icon: Users, description: "+5 new this week", color: "text-blue-500" },
    { title: "Items Processed Today", value: "112", icon: ShoppingBag, description: "Includes 80 garments", color: "text-indigo-500" },
  ];

  const todayTakings = {
    cash: 750.50,
    card: 500.25,
    total: 1250.75
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <Link href="/find-or-add-customer">
          <Button>New Order / Find</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3"> {/* Changed to md:grid-cols-3 */}
        <Card className="shadow-md md:col-span-1"> {/* Recent Orders takes 1 column */}
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>A quick look at the latest orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Order #06-XP-001023 - John Doe</span><span className="text-sm text-green-500">Ready</span></li>
              <li className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Order #06-XP-001022 - Jane Smith</span><span className="text-sm text-yellow-500">Cleaning</span></li>
              <li className="flex justify-between items-center p-2 rounded-md hover:bg-muted"><span>Order #05-XP-001021 - Alice Brown</span><span className="text-sm text-gray-500">Completed</span></li>
            </ul>
            <Link href="/orders" className="mt-4 inline-block">
              <Button variant="outline" size="sm">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md md:col-span-1"> {/* Today's Takings takes 1 column */}
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" /> Today's Takings
            </CardTitle>
            <CardDescription>Summary of sales for the current day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cash Sales:</span>
              <span className="font-semibold">${todayTakings.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Card Sales:</span>
              <span className="font-semibold">${todayTakings.card.toFixed(2)}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Sales:</span>
              <span className="font-bold text-primary">${todayTakings.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">Note: This is a static display. Real data would be fetched dynamically.</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md md:col-span-1"> {/* Quick Actions takes 1 column */}
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used functions.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/find-or-add-customer"><Button className="w-full" variant="secondary">New Order / Find</Button></Link>
            <Link href="/customers/new"><Button className="w-full" variant="secondary">Add Customer</Button></Link>
            <Link href="/reports"><Button className="w-full" variant="secondary">View Reports</Button></Link>
            <Link href="/services"><Button className="w-full" variant="secondary">Manage Services</Button></Link>
            <Link href="/settings" className="col-span-2">
              <Button className="w-full" variant="outline">
                <Briefcase className="mr-2 h-4 w-4" /> Cash Up EOD / Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
