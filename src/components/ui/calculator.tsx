import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Backspace } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  className?: string;
}

export const Calculator = ({ value, onChange, onClose, className }: CalculatorProps) => {
  const [display, setDisplay] = useState(value || "0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  useEffect(() => {
    setDisplay(value || "0");
  }, [value]);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = previousValue || "0";
      const newValue = calculate(parseFloat(currentValue), inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return secondValue !== 0 ? firstValue / secondValue : firstValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
      const currentValue = parseFloat(previousValue);
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleConfirm = () => {
    const numericValue = parseFloat(display);
    if (!isNaN(numericValue) && numericValue > 0) {
      onChange(display);
      onClose?.();
    }
  };

  const buttonClass = "h-12 text-lg font-semibold";
  const operatorClass = "bg-orange-500 hover:bg-orange-600 text-white";
  const numberClass = "bg-gray-100 hover:bg-gray-200 text-gray-900";
  const specialClass = "bg-gray-300 hover:bg-gray-400 text-gray-900";

  return (
    <Card className={cn("w-full max-w-sm mx-auto", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-right text-2xl font-mono font-bold text-gray-900 min-h-[2rem] flex items-center justify-end">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button
            variant="outline"
            className={cn(buttonClass, specialClass)}
            onClick={clear}
          >
            C
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, specialClass)}
            onClick={backspace}
          >
            <Backspace className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, operatorClass)}
            onClick={() => performOperation("÷")}
          >
            ÷
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, operatorClass)}
            onClick={() => performOperation("×")}
          >
            ×
          </Button>

          {/* Row 2 */}
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("7")}
          >
            7
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("8")}
          >
            8
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("9")}
          >
            9
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, operatorClass)}
            onClick={() => performOperation("-")}
          >
            -
          </Button>

          {/* Row 3 */}
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("4")}
          >
            4
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("5")}
          >
            5
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("6")}
          >
            6
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, operatorClass)}
            onClick={() => performOperation("+")}
          >
            +
          </Button>

          {/* Row 4 */}
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("1")}
          >
            1
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("2")}
          >
            2
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={() => inputNumber("3")}
          >
            3
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, "row-span-2", operatorClass)}
            onClick={handleEquals}
          >
            =
          </Button>

          {/* Row 5 */}
          <Button
            variant="outline"
            className={cn(buttonClass, "col-span-2", numberClass)}
            onClick={() => inputNumber("0")}
          >
            0
          </Button>
          <Button
            variant="outline"
            className={cn(buttonClass, numberClass)}
            onClick={inputDecimal}
          >
            .
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleConfirm}
            disabled={parseFloat(display) <= 0 || isNaN(parseFloat(display))}
          >
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};