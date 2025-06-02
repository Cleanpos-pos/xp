
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";
import type { CashUpSession } from "@/types";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, CheckCircle, Edit3 } from "lucide-react";

const MOCK_SYSTEM_CASH = 1250.75; // Placeholder
const MOCK_SYSTEM_CARD = 850.25;  // Placeholder

export function CashUpManagementTab() {
  const { toast } = useToast();

  const [floatAmount, setFloatAmount] = useState<number>(100.00); // Initial float
  const [actualCash, setActualCash] = useState<number>(0);
  const [actualCard, setActualCard] = useState<number>(0);
  
  const [systemCash, setSystemCash] = useState<number>(MOCK_SYSTEM_CASH);
  const [systemCard, setSystemCard] = useState<number>(MOCK_SYSTEM_CARD);

  const [cashUpHistory, setCashUpHistory] = useState<CashUpSession[]>([]);
  const [selectedCashUpId, setSelectedCashUpId] = useState<string | null>(null);

  const [isCashEntryModalOpen, setIsCashEntryModalOpen] = useState(false);
  const [cashEntryInputValue, setCashEntryInputValue] = useState("");
  
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);
  const [floatInputValue, setFloatInputValue] = useState(floatAmount.toFixed(2));


  const cashVariance = actualCash - (systemCash + floatAmount);
  const cardVariance = actualCard - systemCard;

  useEffect(() => {
    // Load history from localStorage (mock)
    const storedHistory = localStorage.getItem("cashUpHistory");
    if (storedHistory) {
      setCashUpHistory(JSON.parse(storedHistory));
    }
     setFloatInputValue(floatAmount.toFixed(2));
  }, [floatAmount]);

  const handleSetOrAdjustFloat = () => {
    const newFloat = parseFloat(floatInputValue);
    if (isNaN(newFloat) || newFloat < 0) {
      toast({ title: "Invalid Amount", description: "Float amount must be a positive number.", variant: "destructive" });
      setFloatInputValue(floatAmount.toFixed(2)); // Reset to current float
      return;
    }
    setFloatAmount(newFloat);
    toast({ title: "Float Updated", description: `Till float set to $${newFloat.toFixed(2)}.` });
  };

  const handleEnterActualCash = () => {
    const newActualCash = parseFloat(cashEntryInputValue);
    if (isNaN(newActualCash) || newActualCash < 0) {
      toast({ title: "Invalid Amount", description: "Actual cash amount must be a positive number.", variant: "destructive" });
      setCashEntryInputValue(actualCash.toFixed(2)); // Reset to current actual or 0
      return;
    }
    setActualCash(newActualCash);
  };

  const handleFinalizeCashUp = () => {
    if (actualCash === 0 && actualCard === 0) {
        toast({ title: "Cannot Finalize", description: "Please enter actual cash or card amounts.", variant: "warning" });
        return;
    }
    const newSession: CashUpSession = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      floatAmount,
      systemCash,
      actualCash,
      cashVariance,
      systemCard,
      actualCard,
      cardVariance,
      finalizedBy: "Current User", // Placeholder
    };
    const updatedHistory = [newSession, ...cashUpHistory];
    setCashUpHistory(updatedHistory);
    localStorage.setItem("cashUpHistory", JSON.stringify(updatedHistory)); // Mock storage
    toast({ title: "Cash Up Finalized", description: `Session stored for ${format(new Date(newSession.timestamp), "PPP p")}.` });
    
    // Reset for next cash up (optional, could also just display the finalized one)
    setActualCash(0);
    setActualCard(0);
    setCashEntryInputValue("0.00");
    // Maybe set system values to 0 or fetch new ones for a new day
    setSystemCash(0); // Example: Reset system figures after finalization
    setSystemCard(0);
    setSelectedCashUpId(newSession.id); // View the newly finalized session
  };
  
  const loadSessionDetails = (sessionId: string | null) => {
    setSelectedCashUpId(sessionId);
    if (sessionId) {
      const session = cashUpHistory.find(s => s.id === sessionId);
      if (session) {
        setFloatAmount(session.floatAmount);
        setSystemCash(session.systemCash);
        setActualCash(session.actualCash);
        setSystemCard(session.systemCard);
        setActualCard(session.actualCard);
        setFloatInputValue(session.floatAmount.toFixed(2));
        setCashEntryInputValue(session.actualCash.toFixed(2));
      }
    } else {
      // Reset to current/new session state
      setFloatAmount(parseFloat(localStorage.getItem("currentFloat") || "100.00")); // Or default
      setSystemCash(MOCK_SYSTEM_CASH); // Reset to mock or fetch new data
      setSystemCard(MOCK_SYSTEM_CARD);
      setActualCash(0);
      setActualCard(0);
      setFloatInputValue(floatAmount.toFixed(2));
      setCashEntryInputValue("0.00");
    }
  };
  
  const renderVariance = (variance: number) => {
    const isPositive = variance >= 0;
    const isZero = variance === 0;
    const Icon = isPositive ? (isZero ? CheckCircle : TrendingUp) : TrendingDown;
    const colorClass = isPositive ? (isZero ? "text-muted-foreground" : "text-green-600") : "text-red-600";
    return (
      <span className={`font-semibold flex items-center ${colorClass}`}>
        <Icon className="mr-1 h-4 w-4" />
        {isPositive && !isZero && "+"}
        {variance.toFixed(2)}
      </span>
    );
  };


  return (
    <div className="space-y-6">
      <AlphanumericKeypadModal
        isOpen={isFloatModalOpen}
        onOpenChange={setIsFloatModalOpen}
        inputValue={floatInputValue}
        onInputChange={setFloatInputValue}
        onConfirm={handleSetOrAdjustFloat}
        title="Set / Adjust Till Float"
        numericOnly={true}
      />
      <AlphanumericKeypadModal
        isOpen={isCashEntryModalOpen}
        onOpenChange={setIsCashEntryModalOpen}
        inputValue={cashEntryInputValue}
        onInputChange={setCashEntryInputValue}
        onConfirm={handleEnterActualCash}
        title="Enter Actual Cash Counted"
        numericOnly={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Till Float Management</CardTitle>
          <CardDescription>Set or adjust the starting cash float in your till.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="current-float" className="text-lg">Current Float: <span className="font-bold text-primary">${floatAmount.toFixed(2)}</span></Label>
            <Button onClick={() => { setFloatInputValue(floatAmount.toFixed(2)); setIsFloatModalOpen(true); }} variant="outline" size="sm">
              <Edit3 className="mr-2 h-4 w-4"/> Set / Adjust Float
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>System Expected Cash (incl. float):</Label>
              <span className="font-mono">${(systemCash + floatAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label>Actual Cash Counted:</Label>
              <span className="font-mono text-lg font-semibold text-blue-600">${actualCash.toFixed(2)}</span>
            </div>
             <Button onClick={() => {setCashEntryInputValue(actualCash > 0 ? actualCash.toFixed(2) : ""); setIsCashEntryModalOpen(true);}} className="w-full">
              <Edit3 className="mr-2 h-4 w-4" /> Enter Actual Cash
            </Button>
            <div className="flex justify-between items-center border-t pt-3 mt-3">
              <Label>Cash Variance:</Label>
              {renderVariance(cashVariance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Payment Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>System Expected Card Payments:</Label>
              <span className="font-mono">${systemCard.toFixed(2)}</span>
            </div>
            <div>
              <Label htmlFor="actual-card" className="block mb-1">Actual Card Payments (from Terminal):</Label>
              <Input
                id="actual-card"
                type="number"
                step="0.01"
                value={actualCard === 0 && !selectedCashUpId ? '' : actualCard.toFixed(2)}
                onChange={(e) => setActualCard(parseFloat(e.target.value) || 0)}
                placeholder="Enter total from card terminal"
                disabled={!!selectedCashUpId}
              />
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-3">
              <Label>Card Variance:</Label>
              {renderVariance(cardVariance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {!selectedCashUpId && (
        <Button onClick={handleFinalizeCashUp} size="lg" className="w-full">
          Finalize & Store Current Cash Up
        </Button>
      )}
      {selectedCashUpId && (
         <Button onClick={() => loadSessionDetails(null)} size="lg" className="w-full" variant="outline">
          Start New Cash Up Session
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cash Up History</CardTitle>
          <CardDescription>Review past cash up sessions. (Stored in browser, will clear on refresh for this demo)</CardDescription>
        </CardHeader>
        <CardContent>
          {cashUpHistory.length === 0 ? (
            <p className="text-muted-foreground">No cash up history found.</p>
          ) : (
            <Select onValueChange={(value) => loadSessionDetails(value)} value={selectedCashUpId || ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a past cash up session to view" />
              </SelectTrigger>
              <SelectContent>
                {cashUpHistory.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {format(new Date(session.timestamp), "PPP p")} (Float: ${session.floatAmount.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
           {selectedCashUpId && cashUpHistory.find(s => s.id === selectedCashUpId) && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h4 className="font-semibold mb-2">Details for session: {format(new Date(cashUpHistory.find(s => s.id === selectedCashUpId)!.timestamp), "PPP p")}</h4>
                <p>Float: ${cashUpHistory.find(s => s.id === selectedCashUpId)!.floatAmount.toFixed(2)}</p>
                <p>System Cash (incl. float): ${ (cashUpHistory.find(s => s.id === selectedCashUpId)!.systemCash + cashUpHistory.find(s => s.id === selectedCashUpId)!.floatAmount).toFixed(2)}</p>
                <p>Actual Cash: ${cashUpHistory.find(s => s.id === selectedCashUpId)!.actualCash.toFixed(2)}</p>
                <p>Cash Variance: {renderVariance(cashUpHistory.find(s => s.id === selectedCashUpId)!.cashVariance)}</p>
                <p>System Card: ${cashUpHistory.find(s => s.id === selectedCashUpId)!.systemCard.toFixed(2)}</p>
                <p>Actual Card: ${cashUpHistory.find(s => s.id === selectedCashUpId)!.actualCard.toFixed(2)}</p>
                <p>Card Variance: {renderVariance(cashUpHistory.find(s => s.id === selectedCashUpId)!.cardVariance)}</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
