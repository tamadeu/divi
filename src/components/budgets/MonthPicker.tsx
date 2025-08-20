"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthPickerProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

const MonthPicker = ({ selectedMonth, onMonthChange }: MonthPickerProps) => {
  const currentYear = new Date().getFullYear();
  // Generate years from 5 years before to 5 years after current year
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); 

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = parseInt(monthIndex, 10);
    const newDate = new Date(selectedMonth.getFullYear(), newMonth, 1); // Set to 1st day of new month
    onMonthChange(newDate);
  };

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year, 10);
    const newDate = new Date(newYear, selectedMonth.getMonth(), 1); // Set to 1st day of new year
    onMonthChange(newDate);
  };

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
      <PopoverContent className="w-auto p-2 flex gap-2">
        <Select
          value={selectedMonth.getMonth().toString()} // Month index (0-11)
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }).map((_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {format(new Date(2000, i, 1), "MMMM", { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  );
};

export default MonthPicker;