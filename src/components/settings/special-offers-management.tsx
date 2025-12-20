
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getSpecialOffersAction, upsertSpecialOfferAction } from "@/app/(auth)/settings/special-offers-actions";
import type { SpecialOffer } from "@/types";
import { Loader2, Save, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SpecialOfferItemSelector } from "./special-offer-item-selector";

export function SpecialOffersManagementTab() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    setLoading(true);
    const data = await getSpecialOffersAction();
    // Ensure we have at least one empty state for each type if not in DB
    const defaults: SpecialOffer[] = [
      { offer_type_identifier: 'BUY_X_GET_Y', is_active: false, buy_x_items: 2, pay_for_y_items: 1 },
      { offer_type_identifier: 'BUNDLE_DEAL', is_active: false, bundle_item_count: 5, bundle_price: 20 },
      { offer_type_identifier: 'SPEND_GET_FREE_ITEM', is_active: false, spend_threshold: 50, free_item_description: 'Free Laundry Bag' }
    ];
    
    // Merge DB data with defaults
    const merged = defaults.map(def => data.find(d => d.offer_type_identifier === def.offer_type_identifier) || def);
    setOffers(merged);
    setLoading(false);
  }

  const handleUpdate = (index: number, field: keyof SpecialOffer, value: any) => {
    const newOffers = [...offers];
    newOffers[index] = { ...newOffers[index], [field]: value };
    setOffers(newOffers);
  };

  const saveOffer = async (offer: SpecialOffer) => {
    setSaving(true);
    const res = await upsertSpecialOfferAction(offer);
    if (res.success) {
      toast({ title: "Saved", description: res.message });
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {offers.map((offer, idx) => (
        <Card key={offer.offer_type_identifier} className={`border-l-4 ${offer.is_active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">
                        {offer.offer_type_identifier === 'BUY_X_GET_Y' && "Buy X Get Y Free"}
                        {offer.offer_type_identifier === 'BUNDLE_DEAL' && "Bundle Deal"}
                        {offer.offer_type_identifier === 'SPEND_GET_FREE_ITEM' && "Spend & Get Reward"}
                    </CardTitle>
                    <CardDescription>
                        {offer.is_active ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                    </CardDescription>
                </div>
                <Switch 
                    checked={offer.is_active} 
                    onCheckedChange={(checked) => handleUpdate(idx, 'is_active', checked)} 
                />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Logic Fields */}
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-md">
                {offer.offer_type_identifier === 'BUY_X_GET_Y' && (
                    <>
                        <div><Label>Buy Items</Label><Input type="number" value={offer.buy_x_items || ''} onChange={e => handleUpdate(idx, 'buy_x_items', e.target.value)} /></div>
                        <div><Label>Pay For</Label><Input type="number" value={offer.pay_for_y_items || ''} onChange={e => handleUpdate(idx, 'pay_for_y_items', e.target.value)} /></div>
                    </>
                )}
                {offer.offer_type_identifier === 'BUNDLE_DEAL' && (
                    <>
                        <div><Label>Bundle Qty</Label><Input type="number" value={offer.bundle_item_count || ''} onChange={e => handleUpdate(idx, 'bundle_item_count', e.target.value)} /></div>
                        <div><Label>Price</Label><Input type="number" value={offer.bundle_price || ''} onChange={e => handleUpdate(idx, 'bundle_price', e.target.value)} /></div>
                    </>
                )}
                {offer.offer_type_identifier === 'SPEND_GET_FREE_ITEM' && (
                    <>
                        <div><Label>Spend Over</Label><Input type="number" value={offer.spend_threshold || ''} onChange={e => handleUpdate(idx, 'spend_threshold', e.target.value)} /></div>
                        <div><Label>Reward</Label><Input value={offer.free_item_description || ''} onChange={e => handleUpdate(idx, 'free_item_description', e.target.value)} placeholder="e.g. Free Bag" /></div>
                    </>
                )}
            </div>

            {/* Assignments Selector */}
            {offer.offer_type_identifier !== 'SPEND_GET_FREE_ITEM' && (
                <SpecialOfferItemSelector
                    selectedItemIds={offer.eligible_items || []}
                    selectedCategoryIds={offer.eligible_categories || []}
                    onItemsChange={(ids) => handleUpdate(idx, 'eligible_items', ids)}
                    onCategoriesChange={(ids) => handleUpdate(idx, 'eligible_categories', ids)}
                />
            )}

            <div>
                <Label>Internal Notes</Label>
                <Textarea value={offer.notes || ''} onChange={e => handleUpdate(idx, 'notes', e.target.value)} placeholder="Terms and conditions..." rows={2} />
            </div>

          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => saveOffer(offer)} disabled={saving} size="sm">
                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Changes
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
