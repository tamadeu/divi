"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthPickerProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

const MonthPicker = ({ selectedMonth, onMonthChange }: MonthPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !selectedMonth && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedMonth ? (
            format(selectedMonth, "MMMM yyyy", { locale: ptBR })
          ) : (
            <span>Selecione um mês</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown-buttons"
          selected={selectedMonth}
          onSelect={(date) => {
            if (date) {
              onMonthChange(date);
            }
          }}
          fromYear={2000}
          toYear={new Date().getFullYear() + 5}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
};

export default MonthPicker;