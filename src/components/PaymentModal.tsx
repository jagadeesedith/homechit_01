import { useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { X } from 'lucide-react';

interface PaymentModalProps {
  memberId: string;
  month: number;
  year: number;
  onClose: () => void;
}

export function PaymentModal({ memberId, month, year, onClose }: PaymentModalProps) {
  const { state, recordPayment, hasMemberPaid } = useChitFund();
  const [principalPaid, setPrincipalPaid] = useState('');

  const member = state.members.find(m => m.id === memberId);
  const isAlreadyPaid = hasMemberPaid(memberId, month, year);

  const isFirstMonth =
    month === state.settings.startMonth && year === state.settings.startYear;
  const contribution = isFirstMonth
    ? state.settings.firstMonthAmount
    : state.settings.monthlyAmount;

  const lastBalance = member?.balance ?? 0;

  const principalNum = parseFloat(principalPaid) || 0;
  const interest = (lastBalance * state.settings.interestRate) / 100;
  const totalToCollect = contribution + principalNum + interest;
  const newBalance = lastBalance - principalNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (principalPaid.trim() === "" || isNaN(parseFloat(principalPaid))) return;
    await recordPayment(memberId, month, year, principalNum);
    onClose();
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        className="bg-gradient-to-br from-white to-blue-50 w-full max-w-[520px] mx-4 rounded-3xl shadow-2xl border border-blue-100 p-7 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              💰 Collect Payment
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {member.id} • {member.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-700 font-medium">Monthly Contribution</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formatINR(contribution)}</p>
          </div>

          <div className="bg-orange-100 rounded-2xl p-4">
            <p className="text-xs text-orange-700 font-medium">Interest</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{formatINR(interest)}</p>
          </div>
        </div>

        <div className="space-y-4">

          <div>
            <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">Member Name</label>
            <p className="text-sm text-[#1d1d1d] font-medium mt-1">{member.name}</p>
          </div>

          <div>
            <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">Last Month Balance</label>
            <p className="text-sm text-[#1d1d1d] font-medium mt-1">{formatINR(lastBalance)}</p>
          </div>

          <div>
            <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">Monthly Contribution</label>
            <p className="text-sm text-[#1d1d1d] font-medium mt-1">
              {formatINR(contribution)} {isFirstMonth && <span className="text-xs text-[#28a745]">(First Month)</span>}
            </p>
          </div>

          {!isAlreadyPaid && (
            <form onSubmit={handleSubmit}>
              <div>
                <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">
                  Principal Paid (Manual Entry)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={principalPaid}
                  onChange={(e) => setPrincipalPaid(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1 w-full text-sm rounded border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87] focus:border-transparent"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2 mt-3">
  {[0, 1000, 2000, 5000].map((amount) => (
    <button
      key={amount}
      type="button"
      onClick={() => setPrincipalPaid(String(amount))}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
        ${
          principalPaid === String(amount)
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        }`}
    >
      ₹{amount}
    </button>
  ))}
</div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">Interest (Auto)</label>
                <p className="text-sm text-[#1d1d1d] font-medium mt-1">{formatINR(interest)}</p>
                <p className="text-xs text-[#6c757d]">2% of Last Month Balance</p>
              </div>

              <div className="border-t border-[#e9ecef] my-4" />

              <div>
                <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">Total to Collect</label>
                <p className="text-lg font-bold text-[#004b87] mt-1">{formatINR(totalToCollect)}</p>
                <p className="text-xs text-[#6c757d]">{formatINR(contribution)} + {formatINR(principalNum)} + {formatINR(interest)}</p>
              </div>

              <div className="mt-3">
                <label className="text-xs text-[#6c757d] font-medium uppercase tracking-wider">New Balance</label>
                <p className="text-sm font-semibold text-[#1d1d1d] mt-1">{formatINR(newBalance)}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={principalPaid.trim() === "" || isNaN(parseFloat(principalPaid))}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#004b87] text-white text-sm font-medium hover:bg-[#003a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          )}

          {isAlreadyPaid && (
            <div className="mt-4">
              <div className="bg-[#d1f2d9] border border-[#28a745] rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-[#28a745]">Payment already recorded for this month</p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2.5 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
