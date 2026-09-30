'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AvailabilityCalendar({
  bookedRanges = [],
  startDate,
  endDate,
  onDateSelect,
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const parseLocalDate = (dateStr) => {
    const [yearPart, monthPart, dayPart] = dateStr.split('-').map(Number);
    return new Date(yearPart, monthPart - 1, dayPart);
  };

  const isDateBooked = (dateStr) => {
    const target = parseLocalDate(dateStr).getTime();
    return bookedRanges.some((range) => {
      const start = parseLocalDate(range.startDate).getTime();
      const end = parseLocalDate(range.endDate).getTime();
      return target >= start && target <= end;
    });
  };

  const isPast = (dateStr) => {
    const target = parseLocalDate(dateStr);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return target < today;
  };

  const isSelected = (dateStr) => {
    if (!startDate || !dateStr) return false;
    if (startDate === dateStr) return true;

    const target = parseLocalDate(dateStr);
    const selectedStart = parseLocalDate(startDate);
    const selectedEnd = endDate ? parseLocalDate(endDate) : null;

    if (selectedEnd) {
      return target >= selectedStart && target <= selectedEnd;
    }

    return false;
  };

  const handleDayClick = (d) => {
    const dateStr = formatDateStr(year, month, d);
    if (isPast(dateStr) || isDateBooked(dateStr)) return;

    if (!startDate || (startDate && endDate)) {
      onDateSelect(dateStr, '');
    } else if (startDate && !endDate) {
      const clickedDate = parseLocalDate(dateStr);
      const selectedStart = parseLocalDate(startDate);

      if (clickedDate < selectedStart) {
        onDateSelect(dateStr, '');
      } else {
        let hasBlockedBetween = false;
        let cur = new Date(selectedStart);
        const endD = new Date(clickedDate);

        while (cur <= endD) {
          const s = formatDateStr(
            cur.getFullYear(),
            cur.getMonth(),
            cur.getDate()
          );

          if (isDateBooked(s)) {
            hasBlockedBetween = true;
            break;
          }

          cur.setDate(cur.getDate() + 1);
        }

        if (hasBlockedBetween) {
          onDateSelect(dateStr, '');
        } else {
          onDateSelect(startDate, dateStr);
        }
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          Check Availability
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-27.5 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <span key={idx} className="text-[11px] font-semibold text-slate-400">
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDateStr(year, month, day);
          const booked = isDateBooked(dateStr);
          const past = isPast(dateStr);
          const selected = isSelected(dateStr);

          let btnClass = 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent';
          if (past) {
            btnClass = 'text-slate-300 cursor-not-allowed';
          } else if (booked) {
            btnClass = 'bg-rose-50 text-rose-500 border border-rose-200 cursor-not-allowed line-through';
          } else if (selected) {
            btnClass = 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-700/30';
          }

          return (
            <button
              key={day}
              type="button"
              disabled={past || booked}
              onClick={() => handleDayClick(day)}
              className={`h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all ${btnClass}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-200 border border-rose-400" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
