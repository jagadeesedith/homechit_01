import { useState } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';

export function MonthlySummaryPage() {
  const { state } = useChitFund();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const payments = state.payments.filter(p => p.month === selectedMonth && p.year === selectedYear);
  const paidMemberIds = new Set(payments.map(p => p.memberId));

  const totals = {
    contribution: payments.reduce((s, p) => s + p.contribution, 0),
    principal: payments.reduce((s, p) => s + p.principalPaid, 0),
    interest: payments.reduce((s, p) => s + p.interest, 0),
    total: payments.reduce((s, p) => s + p.totalPaid, 0),
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1d] mb-6">Monthly Summary</h1>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {MONTHS.map((m, i) => {
            const monthNum = i + 1;
            const isActive = selectedMonth === monthNum;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(monthNum)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200
                  ${isActive
                    ? 'bg-[#004b87] text-white'
                    : 'bg-white border border-[#e9ecef] text-[#6c757d] hover:bg-[#f8f9fa]'
                  }
                `}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="text-sm rounded-lg border border-[#e9ecef] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e9ecef]">
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Member ID</th>
                <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Contribution</th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Principal</th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Interest</th>
                <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Total Paid</th>
                <th className="text-center text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.members.map((member) => {
                const payment = payments.find(p => p.memberId === member.id);
                const isPaid = paidMemberIds.has(member.id);

                return (
                  <tr key={member.id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] font-medium">{member.id}</td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d]">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{payment ? formatINR(payment.contribution) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{payment ? formatINR(payment.principalPaid) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{payment ? formatINR(payment.interest) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right font-medium">{payment ? formatINR(payment.totalPaid) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {isPaid ? (
                        <span className="inline-block bg-[#d1f2d9] text-[#28a745] rounded px-2 py-0.5 text-xs font-medium">Paid</span>
                      ) : (
                        <span className="inline-block bg-[#f8d7da] text-[#dc3545] rounded px-2 py-0.5 text-xs font-medium">Unpaid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f8f9fa] font-semibold">
                <td className="px-4 py-3 text-sm text-[#1d1d1d]" colSpan={2}>Totals</td>
                <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(totals.contribution)}</td>
                <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(totals.principal)}</td>
                <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">{formatINR(totals.interest)}</td>
                <td className="px-4 py-3 text-sm text-[#004b87] text-right">{formatINR(totals.total)}</td>
                <td className="px-4 py-3 text-center text-sm text-[#6c757d]">{payments.length} / {state.members.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
