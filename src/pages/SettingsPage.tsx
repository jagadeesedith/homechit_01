import { useMemo, useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { Settings as SettingsIcon, Check, DollarSign, Percent, Calendar, Users, Clock, Save } from 'lucide-react';

export function SettingsPage() {
  const { state, updateSettings } = useChitFund();
  const initialForm = useMemo(() => state.settings, [state.settings]);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
            <p className="text-gray-600 text-sm font-medium">Configure your chit fund parameters</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-slate-600 to-gray-800 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chit Fund Configuration</h2>
                <p className="text-gray-300 text-sm">Customize your fund parameters and settings</p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Financial Settings */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Financial Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      First Month Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={form.firstMonthAmount}
                        onChange={(e) => setForm({ ...form, firstMonthAmount: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Special amount for the first month (e.g., ₹2,000)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Monthly Contribution (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={form.monthlyAmount}
                        onChange={(e) => setForm({ ...form, monthlyAmount: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Regular monthly contribution (e.g., ₹500)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-500" />
                      Interest Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.interestRate}
                        onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Monthly interest rate on outstanding balance (e.g., 2%)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      Total Members
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={form.totalMembers}
                      onChange={(e) => setForm({ ...form, totalMembers: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of members in fund (e.g., 60)</p>
                  </div>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Schedule Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Starting Month
                    </label>
                    <select
                      value={form.startMonth}
                      onChange={(e) => setForm({ ...form, startMonth: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Starting Year
                    </label>
                    <input
                      type="number"
                      value={form.startYear}
                      onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={form.durationMonths}
                      onChange={(e) => setForm({ ...form, durationMonths: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total duration (e.g., 36 months)</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className={`flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl ${
                    saved
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                  }`}
                >
                  {saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Settings Saved Successfully!
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>

                {saved && (
                  <p className="text-sm text-emerald-600 font-medium mt-3 text-center">
                    ✓ Your chit fund configuration has been updated
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
