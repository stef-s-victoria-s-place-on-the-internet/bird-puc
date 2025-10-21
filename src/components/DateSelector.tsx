import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { DayButton } from 'react-day-picker';
import { Button } from './ui/button';
import './DateSelector.css';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  dayCounts?: Record<string, number>;
}

export function DateSelector({ selectedDate, onDateChange, dayCounts = {} }: DateSelectorProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Custom day button component to show counts
  const CustomDayButton = ({ day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) => {
    const dateKey = format(day.date, 'yyyy-MM-dd');
    const count = dayCounts[dateKey] || 0;
    const isToday = modifiers.today;

    return (
      <Button
        variant="ghost"
        size="icon"
        className={`calendar-day-button ${count > 0 ? 'has-observations' : ''} ${isToday ? 'is-today' : ''}`}
        {...props}
      >
        <div className="calendar-day-content">
          <span className="calendar-day-number">{day.date.getDate()}</span>
          {count > 0 && <span className="calendar-day-count">{count}</span>}
        </div>
      </Button>
    );
  };

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
        month={selectedDate}
        weekStartsOn={1}
        components={{
          DayButton: CustomDayButton,
        }}
      />
    </div>
  );
}

