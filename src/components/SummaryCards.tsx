import { useChitFund } from '../context/ChitFundContext';
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

 const isFirstMonth =
  month === state.settings.startMonth &&
  year === state.settings.startYear;

const contributionAmount = isFirstMonth
  ? state.settings.firstMonthAmount
  : state.settings.monthlyAmount;

const currentTarget = contributionAmount * totalMembers;
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;

        const theme =
          card.label === 'Total Collected'
            ? {
                bg: 'from-blue-50 to-indigo-100',
                border: 'border-blue-200',
                labelText: 'text-blue-800',
                iconTint: 'text-blue-700',
              }
            : card.label === 'Outstanding'
              ? {
                  bg: 'from-rose-50 to-red-100',
                  border: 'border-red-200',
                  labelText: 'text-red-800',
                  iconTint: 'text-red-700',
                }
              : card.label === 'Active Loans'
                ? {
                    bg: 'from-emerald-50 to-green-100',
                    border: 'border-green-200',
                    labelText: 'text-emerald-800',
                    iconTint: 'text-emerald-700',
                  }
                : {
                    bg: 'from-amber-50 to-orange-100',
                    border: 'border-amber-200',
                    labelText: 'text-amber-900',
                    iconTint: 'text-amber-700',
                  };

        return (
          <div
            key={card.label}
            className={`relative overflow-hidden bg-white/70 backdrop-blur p-6 rounded-3xl border ${theme.border} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-70`} />
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-2xl bg-white/60 border border-white/60 shadow-sm flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${theme.iconTint}`} />
                </div>
                <div>
                  <span className={`text-xs font-medium ${theme.labelText}`}>{card.label}</span>
                  <span className="sr-only">{card.subtext}</span>
                </div>
              </div>

              <div className="text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-600 mt-1">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
