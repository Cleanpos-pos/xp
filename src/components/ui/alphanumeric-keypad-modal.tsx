"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface AlphanumericKeypadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: (value: string) => void;
  title: string;
}

export function AlphanumericKeypadModal({
  isOpen,
  onOpenChange,
  inputValue,
  onInputChange,
  onConfirm,
  title,
}: AlphanumericKeypadModalProps) {
  const handleKeyClick = (key: string) => {
    if (key === "BACKSPACE") {
      onInputChange(inputValue.slice(0, -1));
    } else if (key === "CLEAR") {
      onInputChange("");
    } else {
      onInputChange(inputValue + key);
    }
  };

  const handleConfirm = () => {
    onConfirm(inputValue);
    onOpenChange(false); // Close modal on confirm
  };

  const renderKeypad = () => {
    const alphaKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numKeys = '0123456789'.split('');
    const otherKeys = ['-', '_', '.', '@']; // Example other keys
    const controlKeys = ["CLEAR", "BACKSPACE"];

    // Combine and shuffle keys for a less predictable layout (optional, but can be useful for touchscreen)
    // const allKeys = [...alphaKeys, ...numKeys, ...otherKeys];
    // // Simple shuffle (Fisher-Yates)
    // for (let i = allKeys.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [allKeys[i], allKeys[j]] = [allKeys[j], allKeys[i]];
    // }

    return (
      <div className="grid grid-cols-5 gap-2">
        {/* Render Alpha Keys */}
        {alphaKeys.map(key => (
          <Button key={key} className="text-lg h-12" onClick={() => handleKeyClick(key)}>{key}</Button>
        ))}
        {/* Render Other Keys */}
         {otherKeys.map(key => (
          <Button key={key} className="text-lg h-12" onClick={() => handleKeyClick(key)}>{key}</Button>
        ))}
        {/* Render Numeric Keys */}
        {numKeys.map(key => (
          <Button key={key} className="text-lg h-12" onClick={() => handleKeyClick(key)}>{key}</Button>
        ))}
        {/* Render Control Keys */}
        {controlKeys.map(key => (
           <Button key={key} className="text-lg h-12 col-span-2" variant="secondary" onClick={() => handleKeyClick(key)}>{key}</Button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}> {/* Controlled by parent state */} 
      <DialogContent className="sm:max-w-[425px] p-6">{/* Removed DialogTrigger */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input value={inputValue} readOnly className="text-center text-lg mb-4 h-10" placeholder="Tap keys below" />
          {renderKeypad()}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
