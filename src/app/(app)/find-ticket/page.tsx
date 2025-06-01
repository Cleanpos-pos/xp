
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function FindTicketPage() {
  return (
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Search className="mr-2 h-6 w-6" /> Find Ticket / Order
        </CardTitle>
        <CardDescription>
          Search for an existing order by order number, customer name, or phone number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Enter Order #, Customer Name, or Phone..."
            className="flex-1"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
        <div className="text-center text-muted-foreground py-8">
          <p>Search results will appear here.</p>
          <p className="text-xs">(Search functionality is a placeholder for now.)</p>
        </div>
      </CardContent>
    </Card>
  );
}

    