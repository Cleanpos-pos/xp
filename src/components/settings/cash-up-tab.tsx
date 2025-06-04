
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";
import type { CashUpSession, Payout } from "@/types";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, CheckCircle, Edit3, CheckSquare, LogOut, List, Printer, Image as ImageIcon } from "lucide-react"; // Added ImageIcon for placeholder
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from 'next/image'; // For placeholder logo

const MOCK_SYSTEM_CASH_TAKEN = 1250.75; // Placeholder for cash taken via orders
const MOCK_SYSTEM_CARD_TAKEN = 850.25;  // Placeholder for card taken via orders
const NEW_SESSION_VALUE = "__NEW_SESSION__"; // Special value for the "new session" item

export function CashUpManagementTab() {
  const { toast } = useToast();

  // Session State
  const [floatAmount, setFloatAmount] = useState<number>(100.00);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [actualCardTotal, setActualCardTotal] = useState<number>(0);
  
  const [systemCashTakings, setSystemCashTakings] = useState<number>(MOCK_SYSTEM_CASH_TAKEN);
  const [systemCardTakings, setSystemCardTakings] = useState<number>(MOCK_SYSTEM_CARD_TAKEN);

  const [currentSessionPayouts, setCurrentSessionPayouts] = useState<Payout[]>([]);
  const totalPayoutsAmount = currentSessionPayouts.reduce((sum, p) => sum + p.amount, 0);

  const expectedCashInTill = systemCashTakings + floatAmount - totalPayoutsAmount;
  const cashVariance = actualCashCounted - expectedCashInTill;
  const cardVariance = actualCardTotal - systemCardTakings;

  // History and Selection
  const [cashUpHistory, setCashUpHistory] = useState<CashUpSession[]>([]);
  const [selectedCashUpId, setSelectedCashUpId] = useState<string | null>(null); // null means active/new session

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutReason, setPayoutReason] = useState<string>("");
  const [isPayoutAmountModalOpen, setIsPayoutAmountModalOpen] = useState(false);

  // Cash/Card Entry Modals State
  const [isCashEntryModalOpen, setIsCashEntryModalOpen] = useState(false);
  const [cashEntryInputValue, setCashEntryInputValue] = useState("");
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);
  const [floatInputValue, setFloatInputValue] = useState(floatAmount.toFixed(2));
  const [isCardEntryModalOpen, setIsCardEntryModalOpen] = useState(false);
  const [cardEntryInputValue, setCardEntryInputValue] = useState("");

  // Placeholder shop info - in a real app, this would come from context/settings
  const shopInfo = {
    name: "XP Clean Ltd.",
    address: "123 Clean Street, Suite 100, YourTown, YT 54321",
    phone: "(555) 123-4567",
    vatNumber: "GB123456789",
    logoUrl: "https://placehold.co/150x50.png?text=XP+Clean"
  };

  // Load initial data from localStorage
  useEffect(() => {
    const storedHistory = localStorage.getItem("cashUpHistory");
    if (storedHistory) {
      setCashUpHistory(JSON.parse(storedHistory));
    }
    const storedPayouts = localStorage.getItem("allPayoutsHistory"); // Potentially for a global payout log
    // For now, current session payouts are not persisted separately if browser closes without finalizing
    const currentFloat = parseFloat(localStorage.getItem("cashUpFloat") || "100.00");
    setFloatAmount(currentFloat);
    setFloatInputValue(currentFloat.toFixed(2));
  }, []);

  // Save float to localStorage when it changes
  useEffect(() => {
    if (!selectedCashUpId) { // Only save float if it's for the current/new session
      localStorage.setItem("cashUpFloat", floatAmount.toString());
    }
  }, [floatAmount, selectedCashUpId]);

  const handleSetOrAdjustFloat = () => {
    const newFloat = parseFloat(floatInputValue);
    if (isNaN(newFloat) || newFloat < 0) {
      toast({ title: "Invalid Amount", description: "Float amount must be a positive number.", variant: "destructive" });
      setFloatInputValue(floatAmount.toFixed(2));
      return;
    }
    setFloatAmount(newFloat);
    toast({ title: "Float Updated", description: `Till float set to $${newFloat.toFixed(2)}.` });
  };

  const handleEnterActualCash = () => {
    const newActualCash = parseFloat(cashEntryInputValue);
    if (isNaN(newActualCash) || newActualCash < 0) {
      toast({ title: "Invalid Amount", description: "Actual cash amount must be a positive number.", variant: "destructive" });
      setCashEntryInputValue(actualCashCounted > 0 ? actualCashCounted.toFixed(2) : "");
      return;
    }
    setActualCashCounted(newActualCash);
  };
  
  const handleEnterExactCash = () => {
    const exactCash = expectedCashInTill;
    setActualCashCounted(exactCash);
    setCashEntryInputValue(exactCash.toFixed(2));
    toast({ title: "Cash Total Entered", description: `Actual cash total set to system expected: $${exactCash.toFixed(2)}.`});
  };

  const handleEnterActualCard = () => {
    const newActualCard = parseFloat(cardEntryInputValue);
    if (isNaN(newActualCard) || newActualCard < 0) {
      toast({ title: "Invalid Amount", description: "Actual card amount must be a positive number.", variant: "destructive" });
      setCardEntryInputValue(actualCardTotal > 0 ? actualCardTotal.toFixed(2) : "");
      return;
    }
    setActualCardTotal(newActualCard);
  };

  const handleEnterExactCard = () => {
    setActualCardTotal(systemCardTakings);
    setCardEntryInputValue(systemCardTakings.toFixed(2));
    toast({ title: "Card Total Entered", description: `Actual card total set to system expected: $${systemCardTakings.toFixed(2)}.`});
  };

  const handleSavePayout = () => {
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Invalid Payout", description: "Payout amount must be a positive number.", variant: "destructive" });
      return;
    }
    if (!payoutReason.trim()) {
      toast({ title: "Invalid Payout", description: "Payout reason cannot be empty.", variant: "destructive" });
      return;
    }
    const newPayout: Payout = {
      id: `payout-${new Date().toISOString()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      amount: amountNum,
      reason: payoutReason.trim(),
      finalizedBy: "Current User", // Placeholder
    };
    setCurrentSessionPayouts(prev => [...prev, newPayout]);
    toast({ title: "Payout Recorded", description: `$${amountNum.toFixed(2)} for "${payoutReason.trim()}".` });
    setPayoutAmount("");
    setPayoutReason("");
  };
  
  const handlePayoutAmountConfirm = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
        setPayoutAmount("");
        toast({title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
    } else {
        setPayoutAmount(numValue.toFixed(2));
    }
  };


  const handleFinalizeCashUp = () => {
    if (actualCashCounted === 0 && actualCardTotal === 0 && !selectedCashUpId && currentSessionPayouts.length === 0) {
        toast({ title: "Cannot Finalize", description: "Please enter actuals or record payouts for the current session.", variant: "warning" });
        return;
    }
    const newSession: CashUpSession = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      floatAmount,
      systemCash: systemCashTakings, // Store system takings, not expected in till
      actualCash: actualCashCounted,
      cashVariance, // This variance is based on expectedInTill which includes payouts
      systemCard: systemCardTakings,
      actualCard: actualCardTotal,
      cardVariance,
      payouts: [...currentSessionPayouts].map(p => ({...p, sessionId: new Date().toISOString() })), // Assign sessionId
      finalizedBy: "Current User", 
    };
    const updatedHistory = [newSession, ...cashUpHistory];
    setCashUpHistory(updatedHistory);
    localStorage.setItem("cashUpHistory", JSON.stringify(updatedHistory)); 
    toast({ title: "Cash Up Finalized", description: `Session stored for ${format(new Date(newSession.timestamp), "PPP p")}.` });
    
    // Reset for new session
    setActualCashCounted(0);
    setActualCardTotal(0);
    setCurrentSessionPayouts([]);
    setCashEntryInputValue("");
    setCardEntryInputValue("");
    setSystemCashTakings(MOCK_SYSTEM_CASH_TAKEN); 
    setSystemCardTakings(MOCK_SYSTEM_CARD_TAKEN);
    setSelectedCashUpId(newSession.id); // Select the newly finalized session
  };
  
  const loadSessionDetails = (sessionIdOrSpecialValue: string | null) => {
    if (sessionIdOrSpecialValue === NEW_SESSION_VALUE) {
      setSelectedCashUpId(null);
    } else {
      setSelectedCashUpId(sessionIdOrSpecialValue);
    }

    if (sessionIdOrSpecialValue && sessionIdOrSpecialValue !== NEW_SESSION_VALUE) {
      const session = cashUpHistory.find(s => s.id === sessionIdOrSpecialValue);
      if (session) {
        setFloatAmount(session.floatAmount);
        setSystemCashTakings(session.systemCash);
        setActualCashCounted(session.actualCash);
        setSystemCardTakings(session.systemCard);
        setActualCardTotal(session.actualCard);
        setCurrentSessionPayouts(session.payouts || []);
        // For display consistency, update input values if modals were used
        setFloatInputValue(session.floatAmount.toFixed(2));
        setCashEntryInputValue(session.actualCash.toFixed(2));
        setCardEntryInputValue(session.actualCard.toFixed(2));
      }
    } else {
      // Reset to current/new session state
      const lastFloat = parseFloat(localStorage.getItem("cashUpFloat") || "100.00");
      setFloatAmount(lastFloat);
      setFloatInputValue(lastFloat.toFixed(2));
      setSystemCashTakings(MOCK_SYSTEM_CASH_TAKEN); 
      setSystemCardTakings(MOCK_SYSTEM_CARD_TAKEN);
      setActualCashCounted(0);
      setActualCardTotal(0);
      setCurrentSessionPayouts([]);
      setCashEntryInputValue("");
      setCardEntryInputValue("");
    }
  };
  
  const renderVariance = (variance: number) => {
    const isPositive = variance >= 0;
    const isZero = Math.abs(variance) < 0.001;
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

  const isViewingHistory = !!selectedCashUpId;

  const handlePrintCashUp = () => {
    console.log("[Print Debug] handlePrintCashUp function entered.");
    // No setTimeout here, direct call.
    console.log("[Print Debug] About to call window.print() directly.");
    window.print();
    console.log("[Print Debug] window.print() call has been executed.");
  };

  return (
    <div className="space-y-6 thermal-receipt-print-area">
      {/* Modals */}
      <AlphanumericKeypadModal isOpen={isFloatModalOpen} onOpenChange={setIsFloatModalOpen} inputValue={floatInputValue} onInputChange={setFloatInputValue} onConfirm={handleSetOrAdjustFloat} title="Set / Adjust Till Float" numericOnly={true} />
      <AlphanumericKeypadModal isOpen={isCashEntryModalOpen} onOpenChange={setIsCashEntryModalOpen} inputValue={cashEntryInputValue} onInputChange={setCashEntryInputValue} onConfirm={handleEnterActualCash} title="Enter Actual Cash Counted" numericOnly={true} />
      <AlphanumericKeypadModal isOpen={isCardEntryModalOpen} onOpenChange={setIsCardEntryModalOpen} inputValue={cardEntryInputValue} onInputChange={setCardEntryInputValue} onConfirm={handleEnterActualCard} title="Enter Actual Card Total" numericOnly={true} />
      <AlphanumericKeypadModal isOpen={isPayoutAmountModalOpen} onOpenChange={setIsPayoutAmountModalOpen} inputValue={payoutAmount} onInputChange={setPayoutAmount} onConfirm={handlePayoutAmountConfirm} title="Enter Payout Amount" numericOnly={true} />

      {/* Print-only Shop Info Header */}
      <div className="print-visible-only text-center mb-4">
        {shopInfo.logoUrl && (
          <Image 
            src={shopInfo.logoUrl} 
            alt={`${shopInfo.name} Logo`}
            width={150} 
            height={50}
            className="mx-auto mb-2 object-contain"
            data-ai-hint="company logo"
          />
        )}
        <h2 className="text-lg font-bold">{shopInfo.name}</h2>
        <p className="text-xs">{shopInfo.address}</p>
        <p className="text-xs">Phone: {shopInfo.phone}</p>
        {shopInfo.vatNumber && <p className="text-xs">VAT No: {shopInfo.vatNumber}</p>}
        <Separator className="my-2" />
        <h3 className="text-md font-semibold mt-1">Cash Up Summary</h3>
         <p className="text-xs mb-2">
          Date: {format(new Date(selectedCashUpId && cashUpHistory.find(s => s.id === selectedCashUpId) ? cashUpHistory.find(s => s.id === selectedCashUpId)!.timestamp : new Date().toISOString()), "PPP p")}
        </p>
        <Separator className="my-2" />
      </div>


      {/* Float Management */}
      <Card className="print-no-break">
        <CardHeader className="print-hidden"> {/* Hide full header on print */}
          <CardTitle>Till Float Management</CardTitle>
          <CardDescription>Set or adjust the starting cash float in your till.</CardDescription>
        </CardHeader>
        <CardHeader className="print-visible-only pt-2 pb-1"> {/* Simplified header for print */}
          <CardTitle className="text-sm">Till Float</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="current-float" className="text-lg">Current Float: <span className="font-bold text-primary">${floatAmount.toFixed(2)}</span></Label>
            <Button onClick={() => { setFloatInputValue(floatAmount.toFixed(2)); setIsFloatModalOpen(true); }} variant="outline" size="sm" disabled={isViewingHistory} className="print-hidden">
              <Edit3 className="mr-2 h-4 w-4"/> Set / Adjust Float
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout Recording - only for active session */}
      {!isViewingHistory && (
        <Card className="print-no-break">
          <CardHeader className="print-hidden"> {/* Hide full header on print */}
            <CardTitle>Record Payout</CardTitle>
            <CardDescription>Log any cash taken out from the till for expenses.</CardDescription>
          </CardHeader>
           <CardHeader className="print-visible-only pt-2 pb-1"> {/* Simplified header for print */}
             <CardTitle className="text-sm">Payouts This Session</CardTitle>
           </CardHeader>
          <CardContent className="space-y-4">
            <div className="print-hidden"> {/* Hide input fields on print */}
              <Label htmlFor="payoutAmount">Payout Amount</Label>
              <div className="flex items-center space-x-2 cursor-pointer mt-1" onClick={() => setIsPayoutAmountModalOpen(true)}>
                <Input id="payoutAmount" type="text" value={payoutAmount} readOnly placeholder="Tap to enter amount" className="cursor-pointer flex-grow print-hidden" />
                <Edit3 className="h-5 w-5 text-muted-foreground flex-shrink-0 print-hidden" />
              </div>
            </div>
            <div className="print-hidden"> {/* Hide input fields on print */}
              <Label htmlFor="payoutReason">Reason</Label>
              <Textarea id="payoutReason" value={payoutReason} onChange={(e) => setPayoutReason(e.target.value)} placeholder="e.g., Office supplies, Petty cash for delivery" className="mt-1 print-hidden" />
            </div>
            <Button onClick={handleSavePayout} className="w-full sm:w-auto print-hidden" disabled={!payoutAmount || !payoutReason.trim()}>
              <LogOut className="mr-2 h-4 w-4" /> Save Payout
            </Button>
          </CardContent>
           {currentSessionPayouts.length > 0 && (
            <CardFooter className="flex-col items-start pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 print-hidden">Payouts This Session:</h4>
              <ScrollArea className="h-24 w-full pr-3 print-hidden">
                <ul className="space-y-1 text-xs">
                  {currentSessionPayouts.map(p => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.reason}:</span>
                      <span className="font-mono">-${p.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
               <div className="print-visible-only mt-2 space-y-1 text-xs w-full"> {/* For Print: List payouts */}
                  {currentSessionPayouts.map(p => (
                    <div key={`print-${p.id}`} className="flex justify-between">
                      <span>{p.reason}:</span>
                      <span className="font-mono">-${p.amount.toFixed(2)}</span>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between w-full font-semibold text-sm mt-2 border-t pt-2">
                  <span>Total Payouts:</span>
                  <span className="font-mono">-${totalPayoutsAmount.toFixed(2)}</span>
                </div>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Cash & Card Reconciliation */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="print-no-break">
          <CardHeader><CardTitle>Cash Reconciliation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center"><Label>System Cash Takings:</Label><span className="font-mono">${systemCashTakings.toFixed(2)}</span></div>
            <div className="flex justify-between items-center"><Label>Opening Float:</Label><span className="font-mono">${floatAmount.toFixed(2)}</span></div>
            {totalPayoutsAmount > 0 && <div className="flex justify-between items-center"><Label>Total Payouts:</Label><span className="font-mono text-red-500">-${totalPayoutsAmount.toFixed(2)}</span></div>}
            <Separator />
            <div className="flex justify-between items-center font-semibold"><Label>Expected Cash in Till:</Label><span className="font-mono">${expectedCashInTill.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between items-center"><Label>Actual Cash Counted:</Label><span className="font-mono text-lg font-semibold text-blue-600">${actualCashCounted.toFixed(2)}</span></div>
            {!isViewingHistory && (
              <div className="grid grid-cols-2 gap-2 print-hidden">
                <Button onClick={() => {setCashEntryInputValue(actualCashCounted > 0 ? actualCashCounted.toFixed(2) : ""); setIsCashEntryModalOpen(true);}} className="w-full" disabled={isViewingHistory}><Edit3 className="mr-2 h-4 w-4" /> Enter Cash</Button>
                <Button onClick={handleEnterExactCash} variant="outline" className="w-full" disabled={isViewingHistory}><CheckSquare className="mr-2 h-4 w-4" /> Enter Exact</Button>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-3 mt-3"><Label>Cash Variance:</Label>{renderVariance(cashVariance)}</div>
          </CardContent>
        </Card>

        <Card className="print-no-break">
          <CardHeader><CardTitle>Card Payment Reconciliation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center"><Label>System Expected Card Payments:</Label><span className="font-mono">${systemCardTakings.toFixed(2)}</span></div>
             <Separator />
            <div className="flex justify-between items-center"><Label>Actual Card Payments (Terminal):</Label><span className="font-mono text-lg font-semibold text-blue-600">${actualCardTotal.toFixed(2)}</span></div>
            {!isViewingHistory && (
              <div className="grid grid-cols-2 gap-2 print-hidden">
                <Button onClick={() => {setCardEntryInputValue(actualCardTotal > 0 ? actualCardTotal.toFixed(2) : ""); setIsCardEntryModalOpen(true);}} className="w-full" disabled={isViewingHistory}><Edit3 className="mr-2 h-4 w-4" /> Enter Card</Button>
                <Button onClick={handleEnterExactCard} variant="outline" className="w-full" disabled={isViewingHistory}><CheckSquare className="mr-2 h-4 w-4" /> Enter Exact</Button>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-3 mt-3"><Label>Card Variance:</Label>{renderVariance(cardVariance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Finalize / Start New Session Button & Print Button */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4 print-hidden">
        {!isViewingHistory && (
            <Button onClick={handleFinalizeCashUp} size="lg" className="flex-1">
                Finalize & Store Current Cash Up
            </Button>
        )}
        {isViewingHistory && (
            <Button onClick={() => loadSessionDetails(null)} size="lg" className="flex-1" variant="outline">
                Start New Cash Up Session
            </Button>
        )}
        <Button onClick={handlePrintCashUp} size="lg" variant="outline" className="flex-1">
            <Printer className="mr-2 h-5 w-5"/> Print Cash Up Summary
        </Button>
      </div>

      {/* Cash Up History */}
      <Card className="print-no-break">
        <CardHeader className="print-hidden"> {/* Hide this header on print */}
          <CardTitle>Cash Up History</CardTitle>
          <CardDescription>Review past cash up sessions. (Stored in browser local storage)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="print-hidden"> {/* Hide select dropdown on print */}
            {cashUpHistory.length === 0 ? (
              <p className="text-muted-foreground">No cash up history found.</p>
            ) : (
              <Select 
                  onValueChange={(value) => loadSessionDetails(value === NEW_SESSION_VALUE ? null : value)} 
                  value={selectedCashUpId || NEW_SESSION_VALUE}
              >
                <SelectTrigger className={cn("w-full mb-4", "cashup-history-select-trigger")}>
                  <SelectValue placeholder="Select a past cash up session to view, or start new" />
                </SelectTrigger>
                <SelectContent className={cn("cashup-history-select-content")}>
                  <SelectItem value={NEW_SESSION_VALUE}>-- Start New / View Current Session --</SelectItem>
                  {cashUpHistory.map(session => (
                    <SelectItem key={session.id} value={session.id}>
                      {format(new Date(session.timestamp), "PPP p")} (Float: ${session.floatAmount.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
           {isViewingHistory && cashUpHistory.find(s => s.id === selectedCashUpId) && (() => {
            const session = cashUpHistory.find(s => s.id === selectedCashUpId)!;
            const sessionTotalPayouts = (session.payouts || []).reduce((sum, p) => sum + p.amount, 0);
            const sessionExpectedCashInTill = session.systemCash + session.floatAmount - sessionTotalPayouts;

            return (
                <div className="mt-4 p-4 border rounded-md bg-muted/50 space-y-1 text-sm print-visible-only"> {/* This section only visible on print IF a historical session is selected */}
                    <h4 className="font-semibold mb-2 text-md">Details for session: {format(new Date(session.timestamp), "PPP p")}</h4>
                    <div className="flex justify-between"><span>Finalized By:</span> <span>{session.finalizedBy}</span></div>
                    <Separator className="my-2"/>
                    <div className="font-medium">Float:</div>
                    <div className="flex justify-between"><span>Opening Float:</span> <span className="font-mono">${session.floatAmount.toFixed(2)}</span></div>
                    
                    {session.payouts && session.payouts.length > 0 && (
                      <>
                        <Separator className="my-2"/>
                        <div className="font-medium">Payouts During Session:</div>
                        <div className="print-visible-only mt-1 space-y-0.5 text-xs"> {/* For Print: List payouts */}
                          {session.payouts.map(p => (
                            <div key={`print-hist-${p.id}`} className="flex justify-between">
                              <span>{p.reason}:</span>
                              <span className="font-mono">-${p.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                         <div className="flex justify-between font-semibold text-xs border-t pt-1 mt-1">
                           <span>Total Payouts:</span><span className="font-mono">-${sessionTotalPayouts.toFixed(2)}</span>
                         </div>
                      </>
                    )}
                    
                    <Separator className="my-2"/>
                    <div className="font-medium">Cash Reconciliation:</div>
                    <div className="flex justify-between"><span>System Cash Takings:</span> <span className="font-mono">${session.systemCash.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Expected in Till:</span> <span className="font-mono">${sessionExpectedCashInTill.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Actual Counted:</span> <span className="font-mono">${session.actualCash.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Cash Variance:</span> {renderVariance(session.cashVariance)}</div>

                    <Separator className="my-2"/>
                    <div className="font-medium">Card Reconciliation:</div>
                    <div className="flex justify-between"><span>System Expected:</span> <span className="font-mono">${session.systemCard.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Actual from Terminal:</span> <span className="font-mono">${session.actualCard.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Card Variance:</span> {renderVariance(session.cardVariance)}</div>
                </div>
            );
           })()}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground print-hidden">Note: System expected values are currently placeholders. In a real app, these would be dynamically fetched from order data for the reconciliation period.</p>
            <p className="text-xs text-muted-foreground print-visible-only text-center w-full mt-2">--- End of Report ---</p>
        </CardFooter>
      </Card>
    </div>
  );
}

    