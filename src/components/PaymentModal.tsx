import { useState } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
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

  const isFirstMonth = month === 1 && year === new Date().getFullYear();
  const contribution = isFirstMonth ? state.settings.firstMonthAmount : state.settings.monthlyAmount;
  const lastBalance = member?.balance ?? 0;

  const principalNum = parseFloat(principalPaid) || 0;
  const interest = (lastBalance * state.settings.interestRate) / 100;
  const totalToCollect = contribution + principalNum + interest;
  const newBalance = lastBalance - principalNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalPaid || isNaN(parseFloat(principalPaid))) return;
    recordPayment(memberId, month, year, principalNum);
    onClose();
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        className="bg-white w-[480px] rounded-lg shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1d1d1d]">
            {isAlreadyPaid ? 'Payment Details' : 'Collect Payment'} - {member.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#f8f9fa] transition-colors"
          >
            <X className="w-5 h-5 text-[#6c757d]" />
          </button>
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

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!principalPaid || isNaN(parseFloat(principalPaid))}
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
