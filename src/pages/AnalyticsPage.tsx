import { useMemo } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
import { formatINR, getMonthContributionTarget } from '@/lib/utils';
import { sumTotalPaid } from '@/lib/monthPayments';
import { MONTHS } from '@/types';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface Period {
  month: number;
  year: number;
  label: string;
}

function generatePeriods(
  startMonth: number,
  startYear: number,
): Period[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const periods: Period[] = [];
  let m = startMonth;
  let y = startYear;

  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    periods.push({
      month: m,
      year: y,
      label: `${MONTHS[m - 1].slice(0, 3)} ${y}`,
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return periods;
}

export function AnalyticsPage() {
  const { state, getMemberOutstandingBalance } = useChitFund();

  const periods = useMemo(
    () =>
      generatePeriods(state.settings.startMonth, state.settings.startYear),
    [state.settings.startMonth, state.settings.startYear],
  );

  const collectionData = useMemo(
    () =>
      periods.map((p) => ({
        label: p.label,
        collected: sumTotalPaid(state.payments, p.month, p.year),
      })),
    [periods, state.payments],
  );

  const collectionRateData = useMemo(
    () =>
      periods.map((p) => {
        const target = getMonthContributionTarget(
          p.month,
          p.year,
          state.settings,
        );
        const collected = sumTotalPaid(state.payments, p.month, p.year);
        return {
          label: p.label,
          rate: target > 0 ? Math.round((collected / target) * 100) : 0,
        };
      }),
    [periods, state.payments, state.settings],
  );

  const topMembersData = useMemo(
    () =>
      state.members
        .map((m) => ({
          id: m.id,
          name: m.name,
          balance: getMemberOutstandingBalance(m.id),
        }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5),
    [state.members, getMemberOutstandingBalance],
  );

  const interestData = useMemo(
    () =>
      periods.map((p) => {
        const monthPayments = state.payments.filter(
          (pay) => pay.month === p.month && pay.year === p.year,
        );
        const interest = monthPayments.reduce(
          (sum, pay) => sum + pay.interest,
          0,
        );
        return {
          label: p.label,
          interest,
        };
      }),
    [periods, state.payments],
  );

  if (state.payments.length === 0) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Analytics
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Visual insights and trends
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg mb-2">
            No payment data available yet
          </p>
          <p className="text-gray-500 text-sm max-w-md">
            Start recording payments to see analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Analytics
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              Visual insights and trends
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Collection Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Monthly Collection Trend
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Total amount collected per month
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionData}>
              <defs>
                <linearGradient
                  id="collectionGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatINR(value), 'Collected']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
              />
              <Bar
                dataKey="collected"
                fill="url(#collectionGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Collection Rate % */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Collection Rate
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Percentage of target collected per month
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Rate']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
              />
              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: '100%',
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {collectionRateData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.rate >= 100
                        ? '#10b981'
                        : entry.rate >= 75
                          ? '#f59e0b'
                          : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Top 5 Members by Outstanding Balance */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Top 5 Outstanding Balances
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Members with highest outstanding balances
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMembersData}>
              <defs>
                <linearGradient
                  id="top1Grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient
                  id="top2Grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient
                  id="top3Grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient
                  id="top4Grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient
                  id="top5Grad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="id"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatINR(value), 'Outstanding']}
                labelFormatter={(label: string) => {
                  const member = topMembersData.find((m) => m.id === label);
                  return member ? member.name : label;
                }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                {topMembersData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={`url(#top${Math.min(index + 1, 5)}Grad)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Interest Earned per Month */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Interest Earned per Month
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Total interest collected each month
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interestData}>
              <defs>
                <linearGradient
                  id="interestGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatINR(value), 'Interest']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
              />
              <Bar
                dataKey="interest"
                fill="url(#interestGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
