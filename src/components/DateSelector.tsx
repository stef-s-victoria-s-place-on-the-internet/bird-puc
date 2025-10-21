import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import './DateSelector.css';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="date-selector">
      <div className="date-selector-header">
        <h3>Date</h3>
        {isToday ? (
          <span className="today-badge">Today</span>
        ) : (
          <span className="selected-date">{format(selectedDate, 'MMM d, yyyy')}</span>
        )}
      </div>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        disabled={(date) => date > new Date()}
        className="date-selector-calendar"
        defaultMonth={selectedDate}
      />
    </div>
  );
}

