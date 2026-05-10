import { SummaryCards } from "@/components/SummaryCards";

import { MemberGrid } from "@/components/MemberGrid";

import { MONTHS } from "@/types";

import { useChitFund } from "../context/ChitFundContext";

export function DashboardPage() {
  const { state, markAllPaidForMonth, setSelectedMonthYear } = useChitFund();
  const month = state.selectedMonth;
  const year = state.selectedYear;

  const handleMarkAllPaid = async () => {
    await markAllPaidForMonth(month, year);
  };

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(2024, state.settings.startYear, currentYear - 2);
  const maxYear = Math.max(currentYear + 5, state.settings.startYear + 5);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1d]">
            {MONTHS[month - 1]} {year}
          </h1>

          <p className="text-sm text-[#6c757d] mt-1">
            Click on a member box to record their payment
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => setSelectedMonthYear(Number(e.target.value), year)}
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
            onChange={(e) => setSelectedMonthYear(month, Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Mark All Paid */}
          <button
            onClick={handleMarkAllPaid}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-medium shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Mark All as Paid
          </button>
        </div>
      </div>

      <SummaryCards month={month} year={year} />

      <MemberGrid month={month} year={year} />
    </div>
  );
}
