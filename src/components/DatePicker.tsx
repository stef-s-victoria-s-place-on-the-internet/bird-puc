import { format, subDays, addDays } from 'date-fns';
import './DatePicker.css';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    if (!isToday) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  return (
    <div className="date-picker">
      <button 
        onClick={handlePrevDay}
        className="date-nav-btn"
        aria-label="Previous day"
      >
        ←
      </button>
      
      <div className="date-display">
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={handleDateInputChange}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="date-input"
        />
        <span className="date-label">
          {isToday ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
        </span>
      </div>

      <button 
        onClick={handleNextDay}
        className="date-nav-btn"
        disabled={isToday}
        aria-label="Next day"
      >
        →
      </button>

      {!isToday && (
        <button 
          onClick={handleToday}
          className="today-btn"
        >
          Today
        </button>
      )}
    </div>
  );
}

