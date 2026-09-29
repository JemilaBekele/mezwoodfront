'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Operator = '+' | '-' | '×' | '÷';

interface MiniCalculatorProps {
  initialValue?: number;
  onApply: (value: number) => void;
}

const compute = (a: number, b: number, op: Operator): number => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
};

export function MiniCalculator({ initialValue, onApply }: MiniCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const reset = (value = '0') => {
    setDisplay(value);
    setStored(null);
    setOperator(null);
    setWaitingForNext(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) reset(initialValue ? String(initialValue) : '0');
    setOpen(next);
  };

  const inputDigit = (digit: string) => {
    if (display === 'Error' || waitingForNext) {
      setDisplay(digit === '.' ? '0.' : digit === '00' ? '0' : digit);
      setWaitingForNext(false);
      return;
    }
    if (digit === '.' && display.includes('.')) return;
    if (display === '0' && digit !== '.') {
      setDisplay(digit === '00' ? '0' : digit);
      return;
    }
    setDisplay(display + digit);
  };

  const inputOperator = (op: Operator) => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    if (stored !== null && operator && !waitingForNext) {
      const result = compute(stored, current, operator);
      if (isNaN(result)) {
        reset('Error');
        return;
      }
      setStored(result);
      setDisplay(String(parseFloat(result.toFixed(6))));
    } else {
      setStored(current);
    }
    setOperator(op);
    setWaitingForNext(true);
  };

  const calculate = () => {
    if (stored === null || !operator) return;
    const result = compute(stored, parseFloat(display), operator);
    if (isNaN(result)) {
      reset('Error');
      return;
    }
    setDisplay(String(parseFloat(result.toFixed(6))));
    setStored(null);
    setOperator(null);
    setWaitingForNext(true);
  };

  const backspace = () => {
    if (display === 'Error' || waitingForNext) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const apply = () => {
    let value = parseFloat(display);
    if (stored !== null && operator && !waitingForNext) {
      value = compute(stored, value, operator);
    }
    if (isNaN(value)) return;
    onApply(Number(value.toFixed(2)));
    setOpen(false);
  };

  const keys: { label: string; onClick: () => void; variant?: 'default' | 'secondary' | 'outline' }[] = [
    { label: 'C', onClick: () => reset(), variant: 'secondary' },
    { label: '⌫', onClick: backspace, variant: 'secondary' },
    { label: '÷', onClick: () => inputOperator('÷'), variant: 'secondary' },
    { label: '×', onClick: () => inputOperator('×'), variant: 'secondary' },
    { label: '7', onClick: () => inputDigit('7') },
    { label: '8', onClick: () => inputDigit('8') },
    { label: '9', onClick: () => inputDigit('9') },
    { label: '-', onClick: () => inputOperator('-'), variant: 'secondary' },
    { label: '4', onClick: () => inputDigit('4') },
    { label: '5', onClick: () => inputDigit('5') },
    { label: '6', onClick: () => inputDigit('6') },
    { label: '+', onClick: () => inputOperator('+'), variant: 'secondary' },
    { label: '1', onClick: () => inputDigit('1') },
    { label: '2', onClick: () => inputDigit('2') },
    { label: '3', onClick: () => inputDigit('3') },
    { label: '=', onClick: calculate, variant: 'secondary' },
    { label: '0', onClick: () => inputDigit('0') },
    { label: '00', onClick: () => inputDigit('00') },
    { label: '.', onClick: () => inputDigit('.') },
  ];

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" title="Calculator">
          <Calculator className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="end">
        <div className="mb-2 rounded-md border bg-muted px-3 py-2 text-right">
          <div className="h-4 text-[10px] text-muted-foreground font-mono">
            {stored !== null && operator ? `${stored} ${operator}` : ''}
          </div>
          <div className="truncate text-lg font-mono">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {keys.map((key) => (
            <Button
              key={key.label}
              type="button"
              variant={key.variant ?? 'outline'}
              className="h-9 font-mono"
              onClick={key.onClick}
            >
              {key.label}
            </Button>
          ))}
        </div>
        <Button type="button" className="mt-2 w-full" onClick={apply}>
          Use as Unit Price
        </Button>
      </PopoverContent>
    </Popover>
  );
}
