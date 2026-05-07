import { SummaryCards } from '@/components/SummaryCards';
import { MemberGrid } from '@/components/MemberGrid';
import { MONTHS } from '@/types';
import { getCurrentMonthYear } from '@/lib/utils';

export function DashboardPage() {
  const { month, year } = getCurrentMonthYear();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1d1d1d]">
          {MONTHS[month - 1]} {year}
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Click on a member box to record their payment
        </p>
      </div>

      <SummaryCards month={month} year={year} />
      <MemberGrid month={month} year={year} />
    </div>
  );
}
