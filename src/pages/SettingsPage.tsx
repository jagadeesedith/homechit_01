import { useMemo, useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { Settings as SettingsIcon, Check } from 'lucide-react';

export function SettingsPage() {
  const { state, updateSettings } = useChitFund();
  const initialForm = useMemo(() => state.settings, [state.settings]);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

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
            <p className="text-xs text-[#6c757d] mt-1">
              Special amount for the first month (e.g., ₹2,000)
            </p>
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
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Interest Rate (%)</label>
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
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Starting Month</label>
            <select
              value={form.startMonth}
              onChange={(e) => setForm({ ...form, startMonth: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Starting Year</label>
            <input
              type="number"
              value={form.startYear}
              onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
              className="w-full text-sm rounded-lg border border-[#e9ecef] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#004b87]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Duration (Months)</label>
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
            <label className="block text-sm font-medium text-[#1d1d1d] mb-1.5">Total Members</label>
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

