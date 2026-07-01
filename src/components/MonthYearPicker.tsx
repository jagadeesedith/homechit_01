import { useMemo, Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { MONTHS } from "@/types";
import { getYearRange, generateYears } from "@/lib/utils";

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  startYear?: number;
  monthSelectClassName?: string;
  yearSelectClassName?: string;
  monthWrapperClassName?: string;
  renderMonth?: (props: {
    month: number;
    year: number;
    isActive: boolean;
    onChange: (month: number) => void;
  }) => React.ReactNode;
}

export function MonthYearPicker({
  month,
  year,
  onChange,
  startYear = 2025,
  monthSelectClassName = "",
  yearSelectClassName = "",
  monthWrapperClassName = "",
  renderMonth,
}: MonthYearPickerProps) {
  const { minYear, maxYear } = useMemo(
    () => getYearRange(startYear),
    [startYear],
  );

  const years = useMemo(
    () => generateYears(minYear, maxYear),
    [minYear, maxYear],
  );

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${monthWrapperClassName}`}>
      {renderMonth ? (
        <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-xl">
          {MONTHS.map((m, i) => {
            const monthNum = i + 1;
            return (
              <Fragment key={m}>
                {renderMonth({
                  month: monthNum,
                  year,
                  isActive: month === monthNum,
                  onChange: (newMonth) => onChange(newMonth, year),
                })}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div className="relative">
          <select
            value={month}
            onChange={(e) => onChange(Number(e.target.value), year)}
            className={`appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${monthSelectClassName}`}
          >
            {MONTHS.map((monthName, index) => (
              <option key={index} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      <select
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
        className={`px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${yearSelectClassName}`}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
