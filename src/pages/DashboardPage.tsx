import { useEffect, useState } from "react";

import { SummaryCards } from "@/components/SummaryCards";

import { MemberGrid } from "@/components/MemberGrid";

import { MONTHS } from "@/types";

import { useChitFund } from "../context/ChitFundContext";

import { setupFirestore } from "../setupFirestore";

export function DashboardPage() {
  const { state, markAllPaidForMonth } = useChitFund();

  const [month, setMonth] = useState(state.settings.startMonth);

  const [year, setYear] = useState(state.settings.startYear);

  useEffect(() => {
    setMonth(state.settings.startMonth);
    setYear(state.settings.startYear);
  }, [state.settings.startMonth, state.settings.startYear]);

  const handleMarkAllPaid = async () => {
    await markAllPaidForMonth(month, year);
  };

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

          <button
            onClick={setupFirestore}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Setup Firestore
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Month Selector */}
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
