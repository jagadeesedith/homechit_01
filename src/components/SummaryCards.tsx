import { useChitFund } from '@/context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { Wallet, AlertCircle, Banknote, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  month: number;
  year: number;
}

export function SummaryCards({ month, year }: SummaryCardsProps) {
  const { state, getTotalCollectedForMonth, getMonthPayments } = useChitFund();

  const payments = getMonthPayments(month, year);
  const totalCollected = getTotalCollectedForMonth(month, year);
  const totalMembers = state.members.length;
  const paidCount = payments.length;
  const unpaidCount = totalMembers - paidCount;

  const targetAmount = state.settings.monthlyAmount * totalMembers;
  const firstMonthTarget = state.settings.firstMonthAmount * totalMembers;
  const isFirstMonth = month === 1 && year === new Date().getFullYear();
  const currentTarget = isFirstMonth ? firstMonthTarget : targetAmount;

  const outstanding = Math.max(0, currentTarget - totalCollected);

  const totalLoaned = state.members.reduce((sum, m) => sum + m.balance, 0);

  const projectedInterest = payments.reduce((sum, p) => sum + p.interest, 0);

  const cards = [
    {
      label: 'Total Collected',
      value: formatINR(totalCollected),
      subtext: `of ${formatINR(currentTarget)} target`,
      icon: Wallet,
    },
    {
      label: 'Outstanding',
      value: formatINR(outstanding),
      subtext: `${unpaidCount} members pending`,
      icon: AlertCircle,
    },
    {
      label: 'Active Loans',
      value: formatINR(totalLoaned),
      subtext: `Given to ${state.members.filter(m => m.balance > 0).length} members`,
      icon: Banknote,
    },
    {
      label: 'Projected Interest',
      value: formatINR(projectedInterest),
      subtext: 'Based on current balances',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white p-6 rounded-lg border border-[#e9ecef]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-[#6c757d]" />
              <span className="text-xs text-[#6c757d] font-medium">{card.label}</span>
            </div>
            <div className="text-xl font-bold text-[#1d1d1d]">{card.value}</div>
            <div className="text-xs text-[#6c757d] mt-1">{card.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
