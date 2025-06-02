
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
import { TrendingUp, TrendingDown, CheckCircle, Edit3, CheckSquare } from "lucide-react";

const MOCK_SYSTEM_CASH = 1250.75; // Placeholder
const MOCK_SYSTEM_CARD = 850.25;  // Placeholder

export function CashUpManagementTab() {
  const { toast } = useToast();

  const [floatAmount, setFloatAmount] = useState<number>(100.00);
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

  const [isCardEntryModalOpen, setIsCardEntryModalOpen] = useState(false);
  const [cardEntryInputValue, setCardEntryInputValue] = useState("");


  const cashVariance = actualCash - (systemCash + floatAmount);
  const cardVariance = actualCard - systemCard;

  useEffect(() => {
    const storedHistory = localStorage.getItem("cashUpHistory");
    if (storedHistory) {
      setCashUpHistory(JSON.parse(storedHistory));
    }
    const currentFloat = parseFloat(localStorage.getItem("cashUpFloat") || "100.00");
    setFloatAmount(currentFloat);
    setFloatInputValue(currentFloat.toFixed(2));
  }, []);

  useEffect(() => {
    localStorage.setItem("cashUpFloat", floatAmount.toString());
  }, [floatAmount]);


  const handleSetOrAdjustFloat = () => {
    const newFloat = parseFloat(floatInputValue);
    if (isNaN(newFloat) || newFloat < 0) {
      toast({ title: "Invalid Amount", description: "Float amount must be a positive number.", variant: "destructive" });
      setFloatInputValue(floatAmount.toFixed(2)); // Reset input to current float
      return;
    }
    setFloatAmount(newFloat);
    toast({ title: "Float Updated", description: `Till float set to $${newFloat.toFixed(2)}.` });
  };

  const handleEnterActualCash = () => {
    const newActualCash = parseFloat(cashEntryInputValue);
    if (isNaN(newActualCash) || newActualCash < 0) {
      toast({ title: "Invalid Amount", description: "Actual cash amount must be a positive number.", variant: "destructive" });
      setCashEntryInputValue(actualCash > 0 ? actualCash.toFixed(2) : "");
      return;
    }
    setActualCash(newActualCash);
  };
  
  const handleEnterExactCash = () => {
    const exactCash = systemCash + floatAmount;
    setActualCash(exactCash);
    setCashEntryInputValue(exactCash.toFixed(2));
    toast({ title: "Cash Total Entered", description: `Actual cash total set to system expected (incl. float): $${exactCash.toFixed(2)}.`});
  };

  const handleEnterActualCard = () => {
    const newActualCard = parseFloat(cardEntryInputValue);
    if (isNaN(newActualCard) || newActualCard < 0) {
      toast({ title: "Invalid Amount", description: "Actual card amount must be a positive number.", variant: "destructive" });
      setCardEntryInputValue(actualCard > 0 ? actualCard.toFixed(2) : "");
      return;
    }
    setActualCard(newActualCard);
  };

  const handleEnterExactCard = () => {
    setActualCard(systemCard);
    setCardEntryInputValue(systemCard.toFixed(2));
    toast({ title: "Card Total Entered", description: `Actual card total set to system expected: $${systemCard.toFixed(2)}.`});
  };


  const handleFinalizeCashUp = () => {
    if (actualCash === 0 && actualCard === 0 && !selectedCashUpId) {
        toast({ title: "Cannot Finalize", description: "Please enter actual cash or card amounts for the current session.", variant: "warning" });
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
      finalizedBy: "Current User", 
    };
    const updatedHistory = [newSession, ...cashUpHistory];
    setCashUpHistory(updatedHistory);
    localStorage.setItem("cashUpHistory", JSON.stringify(updatedHistory)); 
    toast({ title: "Cash Up Finalized", description: `Session stored for ${format(new Date(newSession.timestamp), "PPP p")}.` });
    
    setActualCash(0);
    setActualCard(0);
    setCashEntryInputValue(""); // Reset for next entry
    setCardEntryInputValue(""); // Reset for next entry
    // Reset system values to mock defaults for a new session, or fetch new values
    setSystemCash(MOCK_SYSTEM_CASH); 
    setSystemCard(MOCK_SYSTEM_CARD);
    setSelectedCashUpId(newSession.id); 
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
        setCardEntryInputValue(session.actualCard.toFixed(2));
      }
    } else {
      // Reset to current/new session state
      const lastFloat = parseFloat(localStorage.getItem("cashUpFloat") || "100.00");
      setFloatAmount(lastFloat);
      setFloatInputValue(lastFloat.toFixed(2));
      setSystemCash(MOCK_SYSTEM_CASH); 
      setSystemCard(MOCK_SYSTEM_CARD);
      setActualCash(0);
      setActualCard(0);
      setCashEntryInputValue("");
      setCardEntryInputValue("");
    }
  };
  
  const renderVariance = (variance: number) => {
    const isPositive = variance >= 0;
    const isZero = Math.abs(variance) < 0.001; // Account for potential float precision issues
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
      <AlphanumericKeypadModal
        isOpen={isCardEntryModalOpen}
        onOpenChange={setIsCardEntryModalOpen}
        inputValue={cardEntryInputValue}
        onInputChange={setCardEntryInputValue}
        onConfirm={handleEnterActualCard}
        title="Enter Actual Card Total"
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
            <Button 
              onClick={() => { setFloatInputValue(floatAmount.toFixed(2)); setIsFloatModalOpen(true); }} 
              variant="outline" 
              size="sm"
              disabled={!!selectedCashUpId}
            >
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
            <div className="grid grid-cols-2 gap-2">
              <Button 
                  onClick={() => {setCashEntryInputValue(actualCash > 0 ? actualCash.toFixed(2) : ""); setIsCashEntryModalOpen(true);}} 
                  className="w-full"
                  disabled={!!selectedCashUpId}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Enter Cash
              </Button>
              <Button 
                  onClick={handleEnterExactCash} 
                  variant="outline" 
                  className="w-full"
                  disabled={!!selectedCashUpId}
              >
                  <CheckSquare className="mr-2 h-4 w-4" /> Enter Exact
              </Button>
            </div>
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
            <div className="flex justify-between items-center">
              <Label>Actual Card Payments (from Terminal):</Label>
              <span className="font-mono text-lg font-semibold text-blue-600">${actualCard.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button 
                    onClick={() => {setCardEntryInputValue(actualCard > 0 ? actualCard.toFixed(2) : ""); setIsCardEntryModalOpen(true);}} 
                    className="w-full"
                    disabled={!!selectedCashUpId}
                >
                    <Edit3 className="mr-2 h-4 w-4" /> Enter Card
                </Button>
                <Button 
                    onClick={handleEnterExactCard} 
                    variant="outline" 
                    className="w-full"
                    disabled={!!selectedCashUpId}
                >
                    <CheckSquare className="mr-2 h-4 w-4" /> Enter Exact
                </Button>
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
          <CardDescription>Review past cash up sessions. (Stored in browser local storage)</CardDescription>
        </CardHeader>
        <CardContent>
          {cashUpHistory.length === 0 ? (
            <p className="text-muted-foreground">No cash up history found.</p>
          ) : (
            <Select onValueChange={(value) => loadSessionDetails(value)} value={selectedCashUpId || ""}>
              <SelectTrigger className="w-full mb-4">
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
            <div className="mt-4 p-4 border rounded-md bg-muted/50 space-y-1 text-sm">
                <h4 className="font-semibold mb-2 text-md">Details for session: {format(new Date(cashUpHistory.find(s => s.id === selectedCashUpId)!.timestamp), "PPP p")}</h4>
                <div className="flex justify-between"><span>Finalized By:</span> <span>{cashUpHistory.find(s => s.id === selectedCashUpId)!.finalizedBy}</span></div>
                <div className="font-medium pt-2">Float:</div>
                <div className="flex justify-between"><span>Opening Float:</span> <span className="font-mono">${cashUpHistory.find(s => s.id === selectedCashUpId)!.floatAmount.toFixed(2)}</span></div>
                
                <div className="font-medium pt-2">Cash (Net of Float):</div>
                <div className="flex justify-between"><span>System Expected (Net):</span> <span className="font-mono">${cashUpHistory.find(s => s.id === selectedCashUpId)!.systemCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Actual Counted (Incl. Float):</span> <span className="font-mono">${cashUpHistory.find(s => s.id === selectedCashUpId)!.actualCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Cash Variance:</span> {renderVariance(cashUpHistory.find(s => s.id === selectedCashUpId)!.cashVariance)}</div>

                <div className="font-medium pt-2">Card:</div>
                <div className="flex justify-between"><span>System Expected:</span> <span className="font-mono">${cashUpHistory.find(s => s.id === selectedCashUpId)!.systemCard.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Actual from Terminal:</span> <span className="font-mono">${cashUpHistory.find(s => s.id === selectedCashUpId)!.actualCard.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Card Variance:</span> {renderVariance(cashUpHistory.find(s => s.id === selectedCashUpId)!.cardVariance)}</div>
            </div>
           )}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">Note: System expected values are currently placeholders. In a real app, these would be dynamically fetched from order data.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
