import { useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { Wallet, AlertCircle, Banknote, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { MonthlyPayment } from '@/types';

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

  const latestPayments = new Map<string, MonthlyPayment>();
  payments.forEach((p) => {
    const existing = latestPayments.get(p.memberId);
    if (
      !existing ||
      new Date(`${p.year}-${p.month}`) >
        new Date(`${existing.year}-${existing.month}`)
    ) {
      latestPayments.set(p.memberId, p);
    }
  });

  const activeLoans = Array.from(latestPayments.values()).reduce(
    (sum, p) => sum + (p.newBalance || 0),
    0,
  );

  const totalLoaned = activeLoans;
  const projectedInterest = totalLoaned * (state.settings.interestRate / 100);

  const collectionRate = currentTarget > 0 ? Math.round((totalCollected / currentTarget) * 100) : 0;
  
  const cards = [
    {
      label: 'Total Collected',
      value: formatINR(totalCollected),
      subtext: `${collectionRate}% of ${formatINR(currentTarget)} target`,
      icon: Wallet,
      trend: collectionRate >= 75 ? 'up' : 'down',
      percentage: collectionRate
    },
    {
      label: 'Outstanding',
      value: formatINR(outstanding),
      subtext: `${unpaidCount} members pending`,
      icon: AlertCircle,
      trend: unpaidCount === 0 ? 'up' : 'down',
      percentage: unpaidCount
    },
    {
      label: 'Active Loans',
      value: formatINR(totalLoaned),
      subtext: `${state.members.filter(m => m.balance > 0).length} members`,
      icon: Banknote,
      trend: totalLoaned > 0 ? 'up' : 'neutral',
      percentage: state.members.filter(m => m.balance > 0).length
    },
    {
      label: 'Projected Interest',
      value: formatINR(projectedInterest),
      subtext: 'Based on current balances',
      icon: TrendingUp,
      trend: projectedInterest > 0 ? 'up' : 'neutral',
      percentage: projectedInterest > 0 ? Math.round((projectedInterest / totalCollected) * 100) : 0
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;

        const theme =
          card.label === 'Total Collected'
            ? {
                bg: 'from-blue-500/5 to-indigo-500/5',
                border: 'border-blue-200/50',
                labelText: 'text-blue-700',
                iconTint: 'text-blue-600',
                iconBg: 'bg-blue-100',
                progressBg: 'bg-blue-500'
              }
            : card.label === 'Outstanding'
              ? {
                  bg: 'from-rose-500/5 to-red-500/5',
                  border: 'border-red-200/50',
                  labelText: 'text-red-700',
                  iconTint: 'text-red-600',
                  iconBg: 'bg-red-100',
                  progressBg: 'bg-red-500'
                }
              : card.label === 'Active Loans'
                ? {
                    bg: 'from-emerald-500/5 to-green-500/5',
                    border: 'border-green-200/50',
                    labelText: 'text-emerald-700',
                    iconTint: 'text-emerald-600',
                    iconBg: 'bg-emerald-100',
                    progressBg: 'bg-emerald-500'
                  }
                : {
                    bg: 'from-amber-500/5 to-orange-500/5',
                    border: 'border-amber-200/50',
                    labelText: 'text-amber-700',
                    iconTint: 'text-amber-600',
                    iconBg: 'bg-amber-100',
                    progressBg: 'bg-amber-500'
                };

        return (
          <div
            key={card.label}
            className="admin-card admin-lift group relative overflow-hidden"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-100`} />
            
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-xl" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-lg" />

            <div className="relative p-6">
              {/* Header with icon and label */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`admin-transition w-12 h-12 rounded-xl ${theme.iconBg} border border-white/60 shadow-sm flex items-center justify-center group-hover:scale-[1.04] transition-transform`}>
                    <Icon className={`w-6 h-6 ${theme.iconTint}`} />
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${theme.labelText}`}>{card.label}</span>
                    <div className="flex items-center gap-1 mt-1">
                      {card.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-600" />}
                      {card.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                      <span className="sr-only">{card.subtext}</span>
                    </div>
                  </div>
                </div>
                
                {/* Trend indicator */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  card.trend === 'up' ? 'bg-green-100 text-green-700' : 
                  card.trend === 'down' ? 'bg-red-100 text-red-600' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {card.trend === 'up' ? '↑' : card.trend === 'down' ? '↓' : '→'}
                </div>
              </div>

              {/* Main value */}
              <div className="text-3xl font-black tracking-tight text-gray-900 mb-2">
                {card.value}
              </div>

              {/* Subtext */}
              <div className="text-sm text-gray-600 mb-3">
                {card.subtext}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`admin-progress h-full ${theme.progressBg} rounded-full transition-all`}
                  style={{ 
                    width: `${Math.min(100, card.label === 'Total Collected' ? card.percentage : 
                              card.label === 'Outstanding' ? Math.max(0, 100 - card.percentage) : 
                              Math.min(100, card.percentage * 10))}%` 
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
