import { useState, useEffect } from 'react';
import { useChitFund } from '@/context/ChitFundContext';
import { Settings as SettingsIcon, Check } from 'lucide-react';

export function SettingsPage() {
  const { state, updateSettings } = useChitFund();
  const [form, setForm] = useState(state.settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(state.settings);
  }, [state.settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1d] mb-6">Settings</h1>

      <div className="bg-white rounded-lg border border-[#e9ecef] p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#004b87]/10 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-[#004b87]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1d]">Chit Fund Configuration</h2>
            <p className="text-xs text-[#6c757d]">Customize your fund parameters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
              First Month Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={form.firstMonthAmount}
              onChange={(e) => setForm({ ...form, firstMonthAmount: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
            <p className="text-xs text-[#6c757d] mt-1">Special amount for the first month (e.g., ₹2,000)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
              Monthly Contribution Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={form.monthlyAmount}
              onChange={(e) => setForm({ ...form, monthlyAmount: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
            <p className="text-xs text-[#6c757d] mt-1">Regular monthly contribution (e.g., ₹500)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
              Interest Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
            <p className="text-xs text-[#6c757d] mt-1">Monthly interest rate on outstanding balance (e.g., 2%)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
              Duration (Months)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
            <p className="text-xs text-[#6c757d] mt-1">Total duration of the chit fund (e.g., 36 months)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">
              Total Members
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={form.totalMembers}
              onChange={(e) => setForm({ ...form, totalMembers: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
            <p className="text-xs text-[#6c757d] mt-1">Number of members in the fund (e.g., 60)</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#28a745] text-white text-sm font-medium rounded-lg hover:bg-[#218838] transition-colors"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
