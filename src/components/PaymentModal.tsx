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
  const { state, recordPayment, hasMemberPaid, getMemberPayments } = useChitFund();
  const [principalPaid, setPrincipalPaid] = useState('0');

  const member = state.members.find(m => m.id === memberId);
  const isAlreadyPaid = hasMemberPaid(memberId, month, year);

  const isFirstMonth =
    month === state.settings.startMonth && year === state.settings.startYear;
  const contribution = isFirstMonth
    ? state.settings.firstMonthAmount
    : state.settings.monthlyAmount;

  const memberPayments = getMemberPayments(memberId);

const latestPayment = [...memberPayments].sort((a, b) => {
  if (a.year !== b.year) return b.year - a.year;
  return b.month - a.month;
})[0];



const lastBalance =
  latestPayment?.newBalance ?? member?.balance ?? 0;

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
        className="bg-gradient-to-br from-white via-cyan-50/35 to-blue-50 w-full max-w-[520px] mx-4 rounded-3xl shadow-2xl border border-cyan-100 p-5 sm:p-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple premium layout */}
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold text-slate-900/90">💰 Collect Payment</p>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center border border-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Member name centered */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-5 mt-1 shadow-lg border border-cyan-300 text-center">
  <h2 className="text-2xl sm:text-3xl font-black text-white">
    {member.name}
  </h2>

  <p className="text-sm font-semibold text-cyan-100 mt-1">
    ID: {member.id}
  </p>
</div>

          {/* Last Month Balance card (full width) */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm font-medium text-emerald-100">Last Month Balance</p>
            <h2 className="text-3xl font-black mt-1">{formatINR(lastBalance)}</h2>
          </div>

          {/* 3 compact cards row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 p-3">
              <p className="text-[11px] font-semibold text-blue-700">Monthly</p>
              <p className="text-lg font-black text-blue-900 mt-1">{formatINR(contribution)}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-b from-orange-50 to-white border border-orange-100 p-3">
              <p className="text-[11px] font-semibold text-orange-700">Interest</p>
              <p className="text-lg font-black text-orange-900 mt-1">{formatINR(interest)}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 border border-emerald-200 p-3 text-white shadow-sm">
              <p className="text-[11px] font-semibold text-emerald-50">Total</p>
              <p className="text-lg font-black text-white mt-1">{formatINR(totalToCollect)}</p>
            </div>
          </div>

          {/* Form area */}
          {!isAlreadyPaid && (
            <form onSubmit={handleSubmit} className="pb-4">
              {/* Principal Paid input */}
              <div>
                <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                  💸 Principal Paid
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={principalPaid}
                  onChange={(e) => setPrincipalPaid(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2 w-full text-lg sm:text-xl rounded-2xl border border-slate-200 p-5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-transparent"
                  autoFocus
                />

                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[0, 1000, 2000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPrincipalPaid(String(amount))}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border shadow-sm
                        ${
                          principalPaid === String(amount)
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white border-teal-200'
                            : 'bg-cyan-50 text-cyan-800 border-cyan-100 hover:bg-cyan-100'
                        }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Balance full-width card */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-100 rounded-2xl border border-yellow-300 p-4 mt-4">
  <p className="text-sm font-semibold text-amber-700">
    💰 New Balance
  </p>

  <h2 className="text-3xl font-black text-amber-700 mt-1">
    {formatINR(newBalance)}
  </h2>
</div>

              {/* Sticky buttons */}
              <div className="sticky bottom-0 z-20 mt-4 pt-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={principalPaid.trim() === "" || isNaN(parseFloat(principalPaid))}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </form>
          )}

          {isAlreadyPaid && (
            <div className="pb-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-emerald-700">Payment already recorded for this month</p>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
