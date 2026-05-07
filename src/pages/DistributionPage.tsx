import { useState } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';
import { HandCoins, Plus } from 'lucide-react';

export function DistributionPage() {
  const { state, addDistribution, getTotalCollectedForMonth } = useChitFund();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const totalCollected = getTotalCollectedForMonth(currentMonth, currentYear);
  const monthDistributions = state.distributions.filter(
    d => d.month === currentMonth && d.year === currentYear
  );

  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState(String(totalCollected));

  const handleGiveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount) return;
    addDistribution(selectedMember, currentMonth, currentYear, parseFloat(amount));
    setShowForm(false);
    setSelectedMember('');
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1d] mb-6">Distribution</h1>

      <div className="bg-white p-6 rounded-lg border border-[#e9ecef] mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">
              Total Collected - {MONTHS[currentMonth - 1]} {currentYear}
            </p>
            <p className="text-3xl font-bold text-[#004b87] mt-2">{formatINR(totalCollected)}</p>
          </div>
          <div className="w-14 h-14 bg-[#004b87]/10 rounded-xl flex items-center justify-center">
            <HandCoins className="w-7 h-7 text-[#004b87]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1d1d1d]">Loan Distribution</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#004b87] text-white text-sm font-medium rounded-lg hover:bg-[#003a6b] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Give Loan
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-[#e9ecef] mb-6">
          <h3 className="text-sm font-semibold text-[#1d1d1d] mb-4">New Distribution</h3>
          <form onSubmit={handleGiveLoan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Select Member</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                required
              >
                <option value="">Choose a member</option>
                {state.members.map(m => (
                  <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                required
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#004b87] text-white text-sm font-medium hover:bg-[#003a6b] transition-colors"
              >
                Give Loan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e9ecef]">
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Member ID</th>
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Loan Amount</th>
                <th className="text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthDistributions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#6c757d]">
                    No distributions recorded for this month
                  </td>
                </tr>
              ) : (
                monthDistributions.map((dist) => {
                  const member = state.members.find(m => m.id === dist.memberId);
                  return (
                    <tr key={dist.id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1d1d1d] font-medium">{dist.memberId}</td>
                      <td className="px-4 py-3 text-sm text-[#1d1d1d]">{member?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right font-medium">{formatINR(dist.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-[#d1f2d9] text-[#28a745] rounded px-2 py-0.5 text-xs font-medium">Given</span>
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
  );
}
