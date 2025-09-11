
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Delete } from "lucide-react"; // For backspace icon

interface AlphanumericKeypadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: (value: string) => void;
  title: string;
  numericOnly?: boolean; // New prop
}

export function AlphanumericKeypadModal({
  isOpen,
  onOpenChange,
  inputValue,
  onInputChange,
  onConfirm,
  title,
  numericOnly = false, // Default to alphanumeric
}: AlphanumericKeypadModalProps) {
  const handleKeyClick = (key: string) => {
    if (key === "BACKSPACE") {
      onInputChange(inputValue.slice(0, -1));
    } else if (key === "CLEAR") {
      onInputChange("");
    } else {
      if (numericOnly) {
        if (key === ".") {
          if (inputValue.includes(".")) return; // Only one decimal point
          onInputChange(inputValue + ".");
        } else if (/\d/.test(key)) { // If it's a digit
          const parts = inputValue.split('.');
          if (inputValue === "0" && key === "0") return; // Prevent "00"
          if (inputValue === "" && key === ".") { // Start with "0." if "." is first
             onInputChange("0.");
             return;
          }
          if (parts.length > 1 && parts[1].length >= 2) {
            return; // Already have 2 decimal places
          }
          if (inputValue === "0" && key !== ".") { // Replace "0" if starting with non-decimal
            onInputChange(key);
          } else {
            onInputChange(inputValue + key);
          }
        }
        // Other keys are ignored if numericOnly and not a digit or handled decimal
      } else {
        // Alphanumeric mode: append any valid key
        onInputChange(inputValue + key);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(numericOnly && (inputValue === "" || inputValue === ".") ? "0" : inputValue);
    onOpenChange(false); // Close modal on confirm
  };

  const renderKeypad = () => {
    if (numericOnly) {
      const numericKeys = [
        '7', '8', '9',
        '4', '5', '6',
        '1', '2', '3',
        '.', '0', 'BACKSPACE'
      ];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {numericKeys.map(key => (
              <Button
                key={key}
                variant={key === "BACKSPACE" ? "secondary" : "default"}
                className="text-xl h-14 aspect-square" // Made buttons square for better touch
                onClick={() => handleKeyClick(key)}
              >
                {key === "BACKSPACE" ? <Delete className="h-6 w-6" /> : key}
              </Button>
            ))}
          </div>
          <Button
            key="CLEAR"
            variant="destructive"
            className="text-lg h-14 w-full"
            onClick={() => handleKeyClick("CLEAR")}
          >
            CLEAR
          </Button>
        </div>
      );
    } else {
      // Existing alphanumeric layout
      const alphaKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const numKeysForAlpha = '0123456789'.split('');
      const otherKeys = ['-', '_', '.', '@', ' ']; // Added space
      const controlKeysForAlpha = ["CLEAR", "BACKSPACE"];

      return (
        <div className="grid grid-cols-6 gap-1 sm:gap-2"> {/* Adjusted grid for better fit */}
          {alphaKeys.map(key => (
            <Button key={key} className="text-lg h-10 sm:h-12 p-1 sm:p-2" onClick={() => handleKeyClick(key)}>{key}</Button>
          ))}
          {numKeysForAlpha.map(key => (
            <Button key={key} className="text-lg h-10 sm:h-12 p-1 sm:p-2" onClick={() => handleKeyClick(key)}>{key}</Button>
          ))}
          {otherKeys.map(key => (
             <Button key={key} className="text-lg h-10 sm:h-12 p-1 sm:p-2" onClick={() => handleKeyClick(key)}>{key === ' ' ? 'SPACE' : key}</Button>
          ))}
          {controlKeysForAlpha.map(key => (
             <Button key={key} className="text-md h-10 sm:h-12 p-1 sm:p-2 col-span-3" variant={key === "CLEAR" ? "destructive" : "secondary"} onClick={() => handleKeyClick(key)}>{key}</Button>
          ))}
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && numericOnly && (inputValue === "" || inputValue === ".")) {
        // If numeric keypad is closed without valid input, set to "0"
         onInputChange("0");
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
           <DialogDescription>
            Use the keypad below to enter the value.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={numericOnly && inputValue === "" ? "0.00" : inputValue} // Display placeholder for empty numeric
            readOnly
            className="text-center text-xl mb-4 h-12"
            placeholder={numericOnly ? "0.00" : "Tap keys below"}
          />
          {renderKeypad()}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleConfirm} className="w-full">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
