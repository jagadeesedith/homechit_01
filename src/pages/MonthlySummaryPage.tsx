import React from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';
import { Calendar, TrendingUp, Users, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export function MonthlySummaryPage() {

  const {
    state,
    setSelectedMonthYear,
    getMonthPayments,
    getPaidCountForMonth,
    getPendingCountForMonth,
    hasMemberPaid,
    getContributionAmount,
    applyContributionToAllMembersForMonth,
  } = useChitFund();


  const currentYear = new Date().getFullYear();
  const selectedMonth = state.selectedMonth;
  const selectedYear = state.selectedYear;

  const minYear = Math.min(2024, state.settings.startYear, currentYear - 2);
  const maxYear = Math.max(currentYear + 5, state.settings.startYear + 5);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);

  const payments = getMonthPayments(selectedMonth, selectedYear);
  const paidMembersCount = getPaidCountForMonth(selectedMonth, selectedYear);
  const pendingMembersCount = getPendingCountForMonth(selectedMonth, selectedYear);

  const totals = {
  contribution: payments.reduce((s, p) => s + p.contribution, 0),
  principal: payments.reduce((s, p) => s + p.principalPaid, 0),
  interest: payments.reduce((s, p) => s + p.interest, 0),
  total: payments.reduce(
    (s, p) =>
      s +
      p.contribution +
      p.principalPaid +
      p.interest,
    0
  ),
};

  const paidPercentage =
    state.members.length > 0
      ? Math.round((paidMembersCount / state.members.length) * 100)
      : 0;

  const [contributionInput, setContributionInput] = React.useState<number>(
    getContributionAmount(selectedMonth, selectedYear),
  );
  const [busyContribution, setBusyContribution] = React.useState(false);

  React.useEffect(() => {
    setContributionInput(getContributionAmount(selectedMonth, selectedYear));
  }, [selectedMonth, selectedYear, getContributionAmount]);

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header */}
      <div className="mb-8">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Monthly Summary</h1>
            <p className="text-gray-600 text-sm font-medium">Detailed payment breakdown and analytics</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-blue-900">{formatINR(totals.total)}</span>
            </div>
            <p className="text-sm font-medium text-blue-800">Total Collected</p>
            <p className="text-xs text-blue-600 mt-1">From all members</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-emerald-900">{paidMembersCount}</span>
            </div>
            <p className="text-sm font-medium text-emerald-800">Members Paid</p>
            <p className="text-xs text-emerald-600 mt-1">{paidPercentage}% completion rate</p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-rose-900">{pendingMembersCount}</span>
            </div>
            <p className="text-sm font-medium text-rose-800">Members Pending</p>
            <p className="text-xs text-rose-600 mt-1">{pendingMembersCount} pending</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-amber-900">{formatINR(totals.interest)}</span>
            </div>
            <p className="text-sm font-medium text-amber-800">Total Interest</p>
            <p className="text-xs text-amber-600 mt-1">Generated this month</p>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select Period</h3>
              <p className="text-sm text-gray-600">Choose month and year to view summary</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Month Pills */}
              <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-xl">
                {MONTHS.map((m, i) => {
                  const monthNum = i + 1;
                  const isActive = selectedMonth === monthNum;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMonthYear(monthNum, selectedYear)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-white hover:shadow-sm'
                        }
                      `}
                    >
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedMonthYear(selectedMonth, Number(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Contribution Management */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Monthly Contribution Management</h3>
              <p className="text-sm text-gray-600">Update contribution amount and apply it to all members for the selected month</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="w-4 h-4" />
              <span>
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-bold text-gray-900">Monthly Contribution Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Number.isFinite(contributionInput) ? contributionInput : 0}
                  onChange={(e) => setContributionInput(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-gray-500">
                This value updates each member&apos;s <span className="font-semibold">payment.contribution</span> for the selected month.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                type="button"
                disabled={busyContribution}
                onClick={async () => {
                  const value = Number(contributionInput);
                  if (!Number.isFinite(value) || value < 0) return;
                  setBusyContribution(true);
                  try {
                    await applyContributionToAllMembersForMonth(
                      selectedMonth,
                      selectedYear,
                      value,
                    );
                    window.alert('Contribution updated successfully for all members.');
                  } finally {
                    setBusyContribution(false);
                  }
                }}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyContribution ? 'Applying...' : 'Apply To All Members'}
              </button>

              <button
                type="button"
                disabled={busyContribution}
                onClick={() => {
                  setContributionInput(getContributionAmount(selectedMonth, selectedYear));
                }}
                className="px-5 py-3 bg-white text-gray-800 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                Auto Fill According To Chit Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
              <p className="text-sm text-gray-600">Individual member payment breakdown</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{state.members.length} Total Members</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Member ID</th>
                <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Contribution</th>
                <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Principal</th>
                <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Interest</th>
                <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Total Paid</th>
                <th className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...state.members].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((member, index) => {
                const payment = payments.find(p => p.memberId === member.id);
                const isPaid = hasMemberPaid(member.id, selectedMonth, selectedYear);

                return (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{member.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{payment ? formatINR(payment.contribution) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{payment ? formatINR(payment.principalPaid) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{payment ? formatINR(payment.interest) : '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{
  payment
    ? formatINR(
        payment.contribution +
        payment.principalPaid +
        payment.interest
      )
    : '-'
}</td>
                    <td className="px-6 py-4 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                          <XCircle className="w-3 h-3" />
                          Unpaid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold">
                <td className="px-6 py-4 text-sm text-gray-900" colSpan={2}>Totals</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">{formatINR(totals.contribution)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">{formatINR(totals.principal)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">{formatINR(totals.interest)}</td>
                <td className="px-6 py-4 text-sm text-blue-600 text-right font-black">{formatINR(totals.total)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {paidMembersCount} / {state.members.length}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
