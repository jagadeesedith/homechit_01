import { useState } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';
import { Search } from 'lucide-react';

export function MemberHistoryPage() {
  const { state, getMemberPayments } = useChitFund();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const member = state.members.find(m => m.id === selectedMemberId);
  const payments = selectedMemberId ? getMemberPayments(selectedMemberId) : [];

  const totalPaidToDate = payments.reduce((s, p) => s + p.totalPaid, 0);
  const monthsActive = payments.length;

  const filteredMembers = state.members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1d] mb-6">Member History</h1>

      <div className="bg-white rounded-lg border border-[#e9ecef] p-6 mb-6">
        <label className="block text-sm font-medium text-[#1d1d1d] mb-2">Select Member</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedMemberId(''); }}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#e9ecef] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
          />
        </div>

        {searchQuery && !selectedMemberId && (
          <div className="mt-2 border border-[#e9ecef] rounded-lg max-h-48 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="p-3 text-sm text-[#6c757d]">No members found</p>
            ) : (
              filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMemberId(m.id); setSearchQuery(`${m.id} - ${m.name}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1d1d1d] hover:bg-[#f8f9fa] border-b border-[#e9ecef] last:border-0 transition-colors"
                >
                  <span className="font-medium">{m.id}</span> - {m.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {member && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Current Balance</p>
              <p className="text-xl font-bold text-[#1d1d1d] mt-1">{formatINR(member.balance)}</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Months Active</p>
              <p className="text-xl font-bold text-[#1d1d1d] mt-1">{monthsActive}</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Total Paid to Date</p>
              <p className="text-xl font-bold text-[#004b87] mt-1">{formatINR(totalPaidToDate)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e9ecef] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e9ecef]">
                    <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Month</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Last Balance</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Contribution</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Principal</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Interest</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Total Paid</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">New Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6c757d]">
                        No payment history found for this member
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#1d1d1d]">
                          {MONTHS[payment.month - 1]} {payment.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(payment.newBalance + payment.principalPaid)}</td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(payment.contribution)}</td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(payment.principalPaid)}</td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(payment.interest)}</td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right font-medium">{formatINR(payment.totalPaid)}</td>
                        <td className="px-4 py-3 text-sm text-[#004b87] text-right font-medium">{formatINR(payment.newBalance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
