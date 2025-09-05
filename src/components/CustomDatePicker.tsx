import { useState, useCallback, useEffect, useRef } from 'react';
import { startOfMonth, endOfMonth, format, isSameDay, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, isSameMonth, isAfter } from 'date-fns';

interface DatePickerProps {
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({ setSelectedDate }) => {
  const [selectedDate, setLocalSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(currentYear, i, 1);
    return {
      label: format(monthDate, 'MMMM'),
      date: monthDate,
      isDisabled: isAfter(monthDate, currentDate) && !isSameMonth(monthDate, currentDate),
      ref: useRef<HTMLButtonElement>(null),
    };
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentMonthIndex = months.findIndex((month) => isSameMonth(month.date, currentDate));
      const monthButton = months[currentMonthIndex]?.ref.current;
      if (monthButton) {
        monthButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen]);

  const handleMonthClick = useCallback((date: Date) => {
    if (isAfter(date, currentDate) && !isSameMonth(date, currentDate)) return;
    setCurrentMonth(date);
    setLocalSelectedDate(date);
    setSelectedDate(date);
    setIsOpen(false);
  }, [setSelectedDate, currentDate]);

  const toggleDatePicker = () => setIsOpen(!isOpen);
  const closeDatePicker = () => setIsOpen(false);

  const resetDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalSelectedDate(null);
    setSelectedDate(null);
  }, [setSelectedDate]);

  const formatSelectedDate = useCallback(() => {
    if (!selectedDate) return 'Select a date';
    return format(selectedDate, 'MMM d, yyyy');
  }, [selectedDate]);

  const handleDateClick = (date: Date) => {
    if (isAfter(date, currentDate)) return;
    setLocalSelectedDate(date);
    setSelectedDate(date);
    setIsOpen(false);
  };

  const generateCalendarDays = (month: Date) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days: Date[] = [];
    let currentDay = start;

    while (currentDay <= end) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    return days;
  };

  const nextMonth = () => {
    const next = addWeeks(currentMonth, 4);
    if (isAfter(next, currentDate) && !isSameMonth(next, currentDate)) return;
    setCurrentMonth(next);
  };

  const prevMonth = () => setCurrentMonth(subWeeks(currentMonth, 4));

  const renderCalendar = (month: Date, offsetMonths: number = 0) => {
    const displayMonth = addWeeks(month, offsetMonths * 4);
    const days = generateCalendarDays(displayMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600" aria-label="Previous month">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-800">{format(displayMonth, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600" aria-label="Next month">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-medium py-2 text-gray-600">{day}</div>
          ))}
          {days.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDisabled = isAfter(day, currentDate) || !isSameMonth(day, displayMonth);

            return (
              <button
                key={index}
                onClick={() => !isDisabled && handleDateClick(day)}
                className={`p-2 rounded-full text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDisabled
                    ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-gray-800 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
                disabled={isDisabled}
                aria-label={`Select ${format(day, 'MMMM d, yyyy')}`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <div onClick={toggleDatePicker} className="flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all duration-500 border border-indigo-300/50 focus-within:ring-4 focus-within:ring-blue-600">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width={21} height={21} viewBox="0 0 24 24" className="text-gray-600">
            <g fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12v2c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14z" />
              <path strokeLinecap="round" d="M7 4V2.5M17 4V2.5M2.5 9h19" />
              <path fill="currentColor" d="M18 17a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/>
            </g>
          </svg>
          <span className={`text-sm transition-colors duration-300 ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{formatSelectedDate()}</span>
        </div>
        <div className="flex items-center gap-3">
          {selectedDate ? (
            <button onClick={resetDate} className="p-1 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-gray-500" aria-label="Clear date">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className={`w-5 h-5 transform transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[52rem] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 transform bg-white/95 backdrop-blur-md border-gray-100 border animate-in fade-in-0 slide-in-from-top-3">
          <div className="flex flex-col lg:flex-row">
            <div className="h-[55.5vh] overflow-y-scroll no-scrollbar p-6 border-b lg:border-b-0 lg:border-r bg-gradient-to-b from-gray-50 to-gray-100 border-gray-100">
              <div className="space-y-1.5">
                {months.map((month, index) => (
                  <button
                    key={index}
                    ref={month.ref}
                    onClick={() => handleMonthClick(month.date)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      month.isDisabled
                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                        : selectedDate && isSameMonth(selectedDate, month.date)
                        ? 'bg-indigo-600 text-white font-semibold shadow-md'
                        : isSameMonth(month.date, currentDate)
                        ? 'bg-indigo-100 text-indigo-700 font-semibold border border-indigo-300'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border border-indigo-50 cursor-pointer'
                    }`}
                    disabled={month.isDisabled}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col w-[170rem]">
              <div className="flex-1 flex flex-col lg:flex-row">{renderCalendar(currentMonth, 0)}</div>

              <div className="flex items-center justify-end p-4 gap-3 bg-gray-50 border-gray-100 border-t">
                <button onClick={resetDate} className="px-4 py-2 text-sm cursor-pointer font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 hover:bg-gray-100" aria-label="Reset date">Reset</button>
                <button onClick={closeDatePicker} className="px-4 py-2 text-sm cursor-pointer font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 hover:bg-gray-100" aria-label="Cancel">Cancel</button>
                <button onClick={closeDatePicker} className="px-4 py-2 text-sm cursor-pointer font-medium text-white rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-600 hover:bg-indigo-700">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;