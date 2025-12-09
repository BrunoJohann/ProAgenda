'use client';

import { useState } from 'react';
import { Button, Popover } from '@proagenda/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
  const today = new Date();

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePrevDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 min-w-[200px] justify-center">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={handleNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="outline" size="sm" onClick={handleToday}>
          Hoje
        </Button>
      )}
    </div>
  );
}







