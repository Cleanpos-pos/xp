
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockInventory } from '@/lib/data';
import type { InventoryItem } from '@/types';
import { ArrowLeft, ExternalLink, Zap, Lightbulb } from 'lucide-react';
import Image from 'next/image';

export default function OrderSuppliesPage() {
  const inventory: InventoryItem[] = getMockInventory();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Order Business Supplies</h1>
          <p className="text-muted-foreground">
            Browse and (theoretically) order supplies for your business operations.
          </p>
        </div>
        <Link href="/inventory">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader>
              <Image 
                src={`https://placehold.co/600x400.png`}
                alt={item.name}
                width={600}
                height={400}
                className="rounded-t-lg object-cover aspect-[3/2]"
                data-ai-hint="product supply"
              />
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle className="font-headline text-xl mb-1">{item.name}</CardTitle>
              <CardDescription>
                Unit: {item.unit}
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                Current Stock: {item.quantity}
                {item.lowStockThreshold && item.quantity <= item.lowStockThreshold && (
                  <span className="text-destructive ml-2">(Low Stock!)</span>
                )}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled> {/* Actual ordering is out of scope */}
                <Zap className="mr-2 h-4 w-4" /> Order Now (Placeholder)
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="shadow-xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-primary/30">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-yellow-500" />
            Featured Partner / Investment Opportunity
          </CardTitle>
          <CardDescription>
            This section is a placeholder where you can showcase information for potential investors or featured partners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can customize this area to include details about your business, investment proposals, or advertisements from partners.
            To make this dynamic (e.g., allow investors to sign up or manage ads themselves) would require further backend development.
          </p>
          <Image
            src="https://placehold.co/800x200.png"
            alt="Placeholder for investor banner"
            width={800}
            height={200}
            className="rounded-md object-cover w-full"
            data-ai-hint="investment banner"
          />
          <div className="text-center">
            <Button variant="secondary" disabled> {/* Example CTA */}
              Learn More <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            This is a sample layout. Content here should be manually updated in the code.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
