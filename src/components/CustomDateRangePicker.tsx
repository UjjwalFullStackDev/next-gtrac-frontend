import { useState, useCallback, useEffect, useRef } from 'react';
import { subDays, startOfMonth, endOfMonth, subMonths, format, isSameDay, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, isSameMonth, isWithinInterval } from 'date-fns';

interface PresetRange {
  label: string;
  range: [Date, Date];
}

interface DateRangePickerProps {
  setDateRange: React.Dispatch<React.SetStateAction<[Date | null, Date | null]>>;
}

const CustomDateRangePicker: React.FC<DateRangePickerProps> = ({ setDateRange }) => {
  const [dateRange, setLocalDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const presetRanges: PresetRange[] = [
    { label: 'Today', range: [new Date(), new Date()] },
    { label: 'Yesterday', range: [subDays(new Date(), 1), subDays(new Date(), 1)] },
    { label: 'Last 7 Days', range: [subDays(new Date(), 6), new Date()] },
    { label: 'Last 30 Days', range: [subDays(new Date(), 29), new Date()] },
    { label: 'This Month', range: [startOfMonth(new Date()), endOfMonth(new Date())] },
    { label: 'Last Month', range: [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] },
    { label: 'This Week', range: [startOfWeek(new Date()), endOfWeek(new Date())] },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = useCallback((range: [Date, Date]) => {
    setLocalDateRange(range);
    setDateRange(range);
    setIsOpen(false);
  }, [setDateRange]);

  const toggleDatePicker = () => setIsOpen(!isOpen);
  const closeDatePicker = () => setIsOpen(false);

  const resetDateRange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalDateRange([null, null]);
    setDateRange([null, null]);
  }, [setDateRange]);

  const formatDateRange = useCallback(() => {
    if (!startDate && !endDate) return 'Select a date range';
    if (!endDate) return `${format(startDate!, 'MMM d, yyyy')} –`;
    return `${format(startDate!, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`;
  }, [startDate, endDate]);

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setLocalDateRange([date, null]);
      setDateRange([date, null]);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setLocalDateRange([date, startDate]);
        setDateRange([date, startDate]);
      } else {
        setLocalDateRange([startDate, date]);
        setDateRange([startDate, date]);
      }
    }
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

  const nextMonth = () => setCurrentMonth(addWeeks(currentMonth, 4));
  const prevMonth = () => setCurrentMonth(subWeeks(currentMonth, 4));

  const renderCalendar = (month: Date, offsetMonths: number = 0) => {
    const displayMonth = addWeeks(month, offsetMonths * 4);
    const days = generateCalendarDays(displayMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className={`p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600`} aria-label="Previous month">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={`text-lg font-semibold text-gray-800`}>{format(displayMonth, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className={`p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-indigo-600`} aria-label="Next month">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {weekDays.map((day) => (
            <div key={day} className={`text-center font-medium py-2 text-gray-600`}>{day}</div>
          ))}
          {days.map((day, index) => {
            const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
            const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate }) && !isSelected;
            const isDisabled = day > new Date() || !isSameMonth(day, displayMonth);

            return (
              <button
                key={index}
                onClick={() => !isDisabled && handleDateClick(day)}
                className={`p-2 rounded-full text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDisabled
                    ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : isInRange
                    ? 'bg-indigo-100 text-indigo-700'
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
      <div onClick={toggleDatePicker} className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all duration-500 border border-indigo-300/50 focus-within:ring-4 focus-within:ring-blue-600`}>
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width={21} height={21} viewBox="0 0 24 24" className={`text-gray-600`}>
            <g fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12v2c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14z" />
              <path strokeLinecap="round" d="M7 4V2.5M17 4V2.5M2.5 9h19" />
              <path fill="currentColor" d="M18 17a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/>
            </g>
          </svg>
          <span className={`text-sm transition-colors duration-300 ${ dateRange[0] ? 'text-gray-900 font-medium' : 'text-gray-400' }`}>{formatDateRange()}</span>
        </div>
        <div className="flex items-center gap-3">
          {(startDate || endDate) && (
            <button onClick={resetDateRange} className={`p-1 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 text-gray-500`} aria-label="Clear date range" >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className={`w-5 h-5 transform transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className={`w-5 h-5 text-indigo-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute right-0 z-50 mt-3 w-[52rem] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 transform bg-white/95 backdrop-blur-md border-gray-100 border animate-in fade-in-0 slide-in-from-top-3`}>
          <div className="flex flex-col lg:flex-row">
            <div className={`p-6 border-b lg:border-b-0 lg:border-r bg-gradient-to-b from-gray-50 to-gray-100 border-gray-100`}>
              <div className="space-y-1.5">
                {presetRanges.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset.range)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      startDate && endDate && isSameDay(startDate, preset.range[0]) && isSameDay(endDate, preset.range[1])
                        ? 'bg-indigo-600 text-white font-semibold shadow-md'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border border-indigo-50 cursor-pointer'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col w-[170rem]">
              <div className="flex-1 flex flex-col lg:flex-row">
                {renderCalendar(currentMonth, 0)}
                {renderCalendar(currentMonth, 1)}
              </div>

              <div className={`flex items-center justify-end p-4 gap-3 bg-gray-50 border-gray-100 border-t`} >
                <button onClick={resetDateRange} className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 hover:bg-gray-100`} aria-label="Reset date range">Reset</button>
                <button onClick={closeDatePicker} className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 hover:bg-gray-100`} aria-label="Cancel">Cancel</button>
                <button onClick={closeDatePicker} className={`px-4 py-2 text-sm cursor-pointer font-medium text-white rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-600 hover:bg-indigo-700`}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateRangePicker;