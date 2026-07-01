import { useState } from 'react';
import { ChitFundError, useChitFund } from '../context/ChitFundContext';
import { toast } from 'sonner';
import { formatINR } from '@/lib/utils';
import { X } from 'lucide-react';
import { MONTHS } from '@/types';

interface PaymentModalProps {
  memberId: string;
  month: number;
  year: number;
  onClose: () => void;
}

export function PaymentModal({ memberId, month, year, onClose }: PaymentModalProps) {
  const {
    state,
    recordPayment,
    hasMemberPaid,
    getMemberOutstandingBalance,
    getContributionAmount,
    deletePayment,
  } = useChitFund();
  const [principalPaid, setPrincipalPaid] = useState('0');

  const member = state.members.find(m => m.id === memberId);
  const isAlreadyPaid = hasMemberPaid(memberId, month, year);

  const contribution = getContributionAmount(month, year);
  const lastBalance = getMemberOutstandingBalance(memberId);

  const principalNum = parseFloat(principalPaid) || 0;
  const interest = (lastBalance * state.settings.interestRate) / 100;
  const totalToCollect = contribution + principalNum + interest;
  const newBalance = lastBalance - principalNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (principalPaid.trim() === "" || isNaN(parseFloat(principalPaid))) return;
    try {
      await recordPayment(memberId, month, year, principalNum);
      onClose();
    } catch (error) {
      const message =
        error instanceof ChitFundError
          ? error.message
          : 'Could not record payment';
      toast.error(message);
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="admin-modal-enter w-full max-w-[520px] mx-4 rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/35 to-blue-50 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple premium layout */}
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold text-slate-900/90">💰 Collect Payment</p>

            <button
              onClick={onClose}
              className="admin-press admin-transition flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 transition-colors hover:bg-white"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Member name centered */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-cyan-500 to-blue-500 p-5 mt-1 text-center shadow-[0_12px_28px_rgba(14,165,233,0.22)]">
  <h2 className="text-2xl sm:text-3xl font-black text-white">
    {member.name}
  </h2>

  <p className="text-sm font-semibold text-cyan-100 mt-1">
    ID: {member.id}
  </p>
</div>

          {/* Last Month Balance card (full width) */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-[0_12px_28px_rgba(5,150,105,0.2)]">
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
                  className="admin-input mt-2 w-full p-5 text-lg sm:text-xl"
                  autoFocus
                />

                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[0, 1000, 2000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPrincipalPaid(String(amount))}
                      className={`admin-press admin-transition rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-[background-color,border-color,color,transform]
                        ${
                          principalPaid === String(amount)
                            ? 'border-teal-200 bg-cyan-600 text-white'
                            : 'border-cyan-100 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
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
                    className="admin-button admin-press flex-1 border border-slate-200 bg-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={principalPaid.trim() === "" || isNaN(parseFloat(principalPaid))}
                    className="admin-button admin-press flex-1 bg-cyan-600 px-4 py-3 font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.2)] hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="admin-button admin-press flex-1 border border-slate-200 bg-white px-4 py-3 text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Undo payment for ${member.name} (${MONTHS[month - 1]} ${year})?`)) return;
                    try {
                      await deletePayment(memberId, month, year);
                      toast.success('Payment undone');
                      onClose();
                    } catch (error) {
                      console.error(error);
                      toast.error('Could not undo payment');
                    }
                  }}
                  className="admin-button admin-press flex-1 border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100"
                >
                  Undo Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
