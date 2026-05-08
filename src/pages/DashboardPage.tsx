import { useState } from 'react';
import { SummaryCards } from '@/components/SummaryCards';
import { MemberGrid } from '@/components/MemberGrid';
import { MONTHS } from '@/types';
import { useChitFund } from '../context/ChitFundContext';

export function DashboardPage() {
  const { state } = useChitFund();

  const [month, setMonth] = useState(state.settings.startMonth);
  const [year, setYear] = useState(state.settings.startYear);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1d]">
            {MONTHS[month - 1]} {year}
          </h1>

          <p className="text-sm text-[#6c757d] mt-1">
            Click on a member box to record their payment
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {MONTHS.map((m, index) => (
              <option key={m} value={index + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SummaryCards month={month} year={year} />
      <MemberGrid month={month} year={year} />
    </div>
  );
}

