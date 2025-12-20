
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PoundSterling, ListChecks, Users, ShoppingBag, Briefcase, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboardStatsAction } from "./actions"; // Import the new action

// Function to map status to colors (same as in orders page for consistency)
function getStatusColor(status: string) {
  switch (status) {
    case 'Completed': return 'text-gray-500';
    case 'Ready for Pickup': return 'text-green-600';
    case 'Processing': return 'text-blue-500';
    case 'Received': return 'text-orange-500';
    default: return 'text-gray-500';
  }
}

export default async function DashboardPage() {
  // Fetch live data from the server action
  const stats = await getDashboardStatsAction();

  const summaryStats = [
    { title: "Today's Revenue", value: `£${stats.revenue_today.toFixed(2)}`, icon: PoundSterling, description: "Booked sales today", color: "text-green-500" },
    { title: "Orders Today", value: stats.orders_count_today.toString(), icon: ListChecks, description: "New orders received", color: "text-yellow-500" },
    { title: "Active Customers", value: stats.active_customers.toString(), icon: Users, description: "Total customer base", color: "text-blue-500" },
    { title: "Items Processed Today", value: stats.items_processed_today.toString(), icon: ShoppingBag, description: "Total items in orders", color: "text-indigo-500" },
  ];

  const todayTakings = {
    cash: stats.takings_cash,
    card: stats.takings_card,
    total: stats.takings_cash + stats.takings_card
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Orders */}
        <Card className="shadow-md md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>A quick look at the latest orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_orders.length > 0 ? (
              <ul className="space-y-2">
                {stats.recent_orders.map((order, idx) => (
                  <li key={idx} className="flex justify-between items-center p-2 rounded-md hover:bg-muted border-b last:border-0 border-border/50">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">{order.customer_name}</span>
                    </div>
                    <span className={`text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent orders found.</p>
            )}
            <Link href="/orders" className="mt-4 inline-block w-full">
              <Button variant="outline" size="sm" className="w-full">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Takings */}
        <Card className="shadow-md md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" /> Today's Takings
            </CardTitle>
            <CardDescription>Payments received today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cash Payments:</span>
              <span className="font-semibold">£{todayTakings.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Card Payments:</span>
              <span className="font-semibold">£{todayTakings.card.toFixed(2)}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Collected:</span>
              <span className="font-bold text-primary">£{todayTakings.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              *Calculated from payments recorded in the system today.
            </p>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card className="shadow-md md:col-span-1">
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
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                <Briefcase className="mr-2 h-4 w-4" /> Cash Up EOD / Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="shadow-md md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-primary" /> Application Settings
            </CardTitle>
            <CardDescription>Configure staff, catalog, printers, and more system options.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button className="w-full" variant="secondary">
                <Settings className="mr-2 h-4 w-4" /> Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
