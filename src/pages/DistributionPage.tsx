import { useState } from 'react';
import { ChitFundError, useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';
import { HandCoins, Plus, Wallet, TrendingUp, Users, ChevronDown, ArrowUpRight, ArrowDownRight, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DistributionPage() {
  const {
    state,
    setSelectedMonthYear,
    addDistribution,
    deleteDistribution,
    hasMemberDistribution,
    getTotalCollectedForMonth,
    getRemainingDistributionForMonth,
    getCarryForwardBalance,
  } = useChitFund();

 const selectedMonth = state.selectedMonth;
const selectedYear = state.selectedYear;

const monthDistributions = state.distributions.filter(
  (d) => d.month === selectedMonth && d.year === selectedYear,
);

const totalCollected = getTotalCollectedForMonth(selectedMonth, selectedYear);

const totalDistributed = monthDistributions.reduce(
  (sum, d) => sum + d.amount,
  0,
);

const carryForward = getCarryForwardBalance(selectedMonth, selectedYear);
const remaining = getRemainingDistributionForMonth(selectedMonth, selectedYear);

  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only set default amount when form opens, don't override user edits
  const handleOpenForm = () => {
    setShowForm(true);
    setAmount(String(Math.max(0, Math.round(remaining))));
  };

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(2024, state.settings.startYear, currentYear - 2);
  const maxYear = Math.max(currentYear + 5, state.settings.startYear + 5);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);

  const saveDistribution = async () => {
    if (!selectedMember || !amount || submitting) return;

    const member = state.members.find((m) => m.id === selectedMember);
    if (!member) return;

    const loanAmount = Number(amount);
    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      toast.error('Enter a valid loan amount');
      return;
    }

    if (hasMemberDistribution(member.id, selectedMonth, selectedYear)) {
      toast.error('This member already received a loan this month');
      return;
    }

    if (loanAmount > remaining) {
      toast.error(`Cannot exceed remaining balance of ${formatINR(remaining)}`);
      return;
    }

    setSubmitting(true);
    try {
      await addDistribution(member.id, selectedMonth, selectedYear, loanAmount);
      toast.success('Distribution saved');
      setShowForm(false);
      setSelectedMember('');
    } catch (error) {
      const message =
        error instanceof ChitFundError
          ? error.message
          : 'Could not save distribution';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveDistribution();
  };

  const handleDeleteDistribution = async (distributionId: string) => {
    try {
      await deleteDistribution(distributionId);
      setDeleteConfirm(null);
      toast.success('Distribution removed');
    } catch (error) {
      console.error('Error deleting distribution:', error);
      toast.error('Error deleting distribution. Please try again.');
    }
  };

  const distributionRate = totalCollected > 0 ? Math.round((totalDistributed / totalCollected) * 100) : 0;

  const membersAvailableForLoan = [...state.members]
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
    .filter(
      (m) => !hasMemberDistribution(m.id, selectedMonth, selectedYear),
    );

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <HandCoins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Distribution</h1>
            <p className="text-gray-600 text-sm font-medium">Manage loan distributions and fund allocations</p>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select Period</h3>
              <p className="text-sm text-gray-600">Choose month and year to view distributions</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonthYear(Number(e.target.value), selectedYear)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  {MONTHS.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedMonthYear(selectedMonth, Number(e.target.value))}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Money Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Collected</p>
            <p className="text-3xl font-black text-white">{formatINR(totalCollected)}</p>
            <p className="text-blue-200 text-xs mt-2">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <HandCoins className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Distributed</p>
            <p className="text-3xl font-black text-white">{formatINR(totalDistributed)}</p>
            <p className="text-emerald-200 text-xs mt-2">{distributionRate}% of collected</p>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl text-white ${
            remaining < 0
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-amber-500 to-orange-600'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <ArrowDownRight className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-amber-100 text-sm font-medium mb-1">Remaining Balance</p>
            <p className="text-3xl font-black text-white">{formatINR(remaining)}</p>
            <p className="text-amber-200 text-xs mt-2">
              {remaining < 0 ? 'Over-distributed — review entries' : 'Available for distribution'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Carry Forward</p>
            <p className="text-3xl font-black text-white">{formatINR(carryForward)}</p>
            <p className="text-purple-200 text-xs mt-2">Surplus from previous month</p>
          </div>
        </div>
      </div>

      {/* Distribution Management */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - New Distribution Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">New Distribution</h3>
                  <p className="text-orange-100 text-sm">Give loan to member</p>
                </div>
                {!showForm && (
                  <button
                    type="button"
                    onClick={handleOpenForm}
                    disabled={remaining <= 0}
                    className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            {showForm && (
              <div className="p-6">
                <form onSubmit={handleGiveLoan} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Select Member</label>
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      required
                    >
                      <option value="">Choose a member</option>
                      {membersAvailableForLoan.map(m => (
                        <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        required
                        min="1"
                        max={Math.max(0, remaining)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max available: {formatINR(Math.max(0, remaining))}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || remaining <= 0}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : 'Give Loan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && (
              <div className="p-6 text-center">
                <HandCoins className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No active distribution</p>
                <p className="text-gray-500 text-sm mt-1">Click the + button to create a new loan distribution</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Distribution History */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Distribution History</h3>
                  <p className="text-sm text-gray-600">Loan distributions for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{monthDistributions.length} Loans</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Member ID</th>
                    <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Name</th>
                    <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Loan Amount</th>
                    <th className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthDistributions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <HandCoins className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No distributions recorded</p>
                        <p className="text-gray-400 text-sm mt-1">Start by giving a loan to a member</p>
                      </td>
                    </tr>
                  ) : (
                    monthDistributions.map((dist, index) => {
                      const member = state.members.find(m => m.id === dist.memberId);
                      return (
                        <tr
                          key={dist.id}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{dist.memberId}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{member?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-orange-600 text-right">{formatINR(dist.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              Given
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(dist.id)}
                              className="group relative p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                              title="Delete distribution"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Distribution</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this loan distribution?</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This will remove the loan amount from the member&apos;s balance and cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDistribution(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Delete Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
