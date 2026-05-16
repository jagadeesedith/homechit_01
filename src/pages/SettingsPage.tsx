import { useMemo, useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import {
  Settings as SettingsIcon,
  Check,
  DollarSign,
  Percent,
  Calendar,
  Users,
  Clock,
  Save,
  AlertTriangle,
  Shield,
  RotateCcw,
  X,
  Mail,
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import {
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

type ResetStep = 'confirm' | 'verify' | 'busy' | 'done' | 'error';

type ResetState = {
  open: boolean;
  step: ResetStep;
  confirmText: string;
  typedOtp: string;
  expectedOtp: string;
  maskedEmail: string;
  loadingSendOtp: boolean;
  loadingReset: boolean;
  error?: string;
  lastSentAt?: number;
};

const RESET_PHRASE = 'RESET EVERYTHING';

function getMaskedGmail(email?: string | null) {
  if (!email) return '';
  const at = email.indexOf('@');
  if (at <= 1) return email;

  const username = email.slice(0, at);
  const domain = email.slice(at);

  const start = username.slice(0, 1);
  const end = username.slice(-3);
  const maskedCount = Math.max(0, username.length - 4);
  const masked = '*'.repeat(maskedCount);

  return `${start}${masked}${end}${domain}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function deleteMemberSubcollection(userId: string, collectionName: string) {
  const colRef = collection(db, 'users', userId, collectionName);
  const snap = await getDocs(colRef);

  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
}

export function SettingsPage() {
  const { state, updateSettings } = useChitFund();
  const initialForm = useMemo(() => state.settings, [state.settings]);
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);

  const [reset, setReset] = useState<ResetState>({
    open: false,
    step: 'confirm',
    confirmText: '',
    typedOtp: '',
    expectedOtp: '',
    maskedEmail: '',
    loadingSendOtp: false,
    loadingReset: false,
    error: undefined,
    lastSentAt: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const closeResetModal = () => {
    setReset((prev) => ({
      ...prev,
      open: false,
      step: 'confirm',
      confirmText: '',
      typedOtp: '',
      expectedOtp: '',
      maskedEmail: '',
      error: undefined,
      lastSentAt: undefined,
      loadingSendOtp: false,
      loadingReset: false,
    }));
  };

  const openResetModal = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Login first');
      return;
    }

    const email = user.email;
    const maskedEmail = getMaskedGmail(email);

    // Clear previous
    setReset({
      open: true,
      step: 'confirm',
      confirmText: '',
      typedOtp: '',
      expectedOtp: '',
      maskedEmail,
      loadingSendOtp: false,
      loadingReset: false,
      error: undefined,
      lastSentAt: undefined,
    });
  };

  const sendOtp = async () => {
    const user = auth.currentUser;
    if (!user) {
      setReset((prev) => ({ ...prev, error: 'User not logged in.' }));
      return;
    }

    const email = user.email;
    if (!email) {
      setReset((prev) => ({ ...prev, error: 'User email not available.' }));
      return;
    }

    const expectedOtp = generateOtp();

    setReset((prev) => ({
      ...prev,
      loadingSendOtp: true,
      error: undefined,
      expectedOtp,
      typedOtp: '',
      lastSentAt: Date.now(),
    }));

    try {
      await emailjs.send(
  'service_f8glpju',
  'template_ow7pvnm',
  {
    otp: expectedOtp,
    to_email: email,
  },
  'Q977OTAOQ0YB8_Mbh',
);

      // move to verify step (only after email send succeeds)
      setReset((prev) => ({
        ...prev,
        step: 'verify',
        loadingSendOtp: false,
      }));
    } catch (e) {
      console.error(e);
      setReset((prev) => ({
        ...prev,
        loadingSendOtp: false,
        step: 'error',
        error: 'Failed to send OTP. Please try again.',
      }));
    }
  };

  const handleContinue = async () => {
    if (reset.confirmText.trim() !== RESET_PHRASE) {
      setReset((prev) => ({
        ...prev,
        error: 'Type RESET EVERYTHING exactly to continue.',
      }));
      return;
    }

    // clear error and send OTP
    setReset((prev) => ({ ...prev, error: undefined }));
    await sendOtp();
  };

  const handleVerifyAndReset = async () => {
    const typed = reset.typedOtp.trim();

    if (!typed || typed.length !== 6) {
      setReset((prev) => ({
        ...prev,
        error: 'Enter the 6-digit OTP.',
      }));
      return;
    }

    if (typed !== reset.expectedOtp) {
      setReset((prev) => ({
        ...prev,
        error: 'Incorrect OTP. Please try again.',
      }));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setReset((prev) => ({
        ...prev,
        step: 'error',
        error: 'User not logged in.',
      }));
      return;
    }

    setReset((prev) => ({
      ...prev,
      step: 'busy',
      loadingReset: true,
      error: undefined,
    }));

    try {
      const userId = user.uid;

      // delete only for currently logged in user
      await deleteMemberSubcollection(userId, 'members');
      await deleteMemberSubcollection(userId, 'payments');
      await deleteMemberSubcollection(userId, 'distributions');

      // success
      setReset((prev) => ({
        ...prev,
        step: 'done',
        loadingReset: false,
      }));

      alert('Reset complete. The app data has been cleared for this account.');

      // close after a short delay
      setTimeout(() => closeResetModal(), 1200);
    } catch (e) {
      console.error(e);
      setReset((prev) => ({
        ...prev,
        step: 'error',
        loadingReset: false,
        error: 'Reset failed. Please try again.',
      }));
    }
  };

  const resetConfirmMatches = reset.confirmText.trim() === RESET_PHRASE;

  const disableDeleteButton = !resetConfirmMatches || reset.loadingSendOtp;

  // Avoid Date.now() in render (React purity). We only enforce resend cooldown after clicking resend.
  const canResendOtp = true;


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
                      Interest Rate (% )
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

        {/* Danger Zone */}
        <div className="mt-6">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 shadow-xl border border-red-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Danger Zone</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/15">Premium</span>
                </h3>
                <p className="text-sm text-red-100 mt-1 leading-relaxed">
                  Reset will permanently delete <span className="font-semibold">members</span>,{' '}
                  <span className="font-semibold">payments</span>, and{' '}
                  <span className="font-semibold">distributions</span> for your current account.
                  It cannot be undone.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-xs text-red-100 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Required multi-step verification with OTP</span>
                  </div>

                  <button
                    type="button"
                    onClick={openResetModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm transition-all duration-200 hover:bg-white/15 hover:-translate-y-[1px] active:translate-y-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Everything
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-red-50/90">
              Note: Firebase Authentication & Google Sign-In accounts are NOT deleted.
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {reset.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeResetModal}
          />

          <div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <h4 className="font-black text-lg">Reset Everything</h4>
                    <p className="text-xs text-red-50/90">Multi-step verification required</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeResetModal}
                  className="rounded-lg p-2 hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {reset.step !== 'busy' && reset.step !== 'done' && (
                <div className="mb-5">
                  <div className="text-sm font-bold text-gray-900">
                    Step {reset.step === 'confirm' ? '1' : '2'}:{' '}
                    {reset.step === 'confirm' ? 'Confirm' : 'Verify OTP'}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    {reset.step === 'confirm' ? (
                      <>Type the phrase exactly to enable the next step.</>
                    ) : (
                      <>Enter the OTP sent to your email.</>
                    )}
                  </div>
                </div>
              )}

              {reset.step === 'confirm' && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-800 font-semibold">
                      <Mail className="w-4 h-4" />
                      <span>Verification required</span>
                    </div>
                    <p className="text-sm text-red-700 mt-2 leading-relaxed">
                      Type <span className="font-black">{RESET_PHRASE}</span> below. The Continue button will enable only when the text matches.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Confirmation Phrase
                    </label>
                    <input
                      value={reset.confirmText}
                      onChange={(e) =>
                        setReset((prev) => ({
                          ...prev,
                          confirmText: e.target.value,
                          error: undefined,
                        }))
                      }
                      placeholder={RESET_PHRASE}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition ${
                        reset.confirmText.trim().length === 0
                          ? 'border-gray-200 focus:ring-2 focus:ring-red-500/20'
                          : resetConfirmMatches
                            ? 'border-green-400 focus:ring-2 focus:ring-green-500/20'
                            : 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                      }`}
                    />

                    {reset.maskedEmail ? (
                      <p className="mt-3 text-xs text-gray-500">
                        OTP will be sent to: <span className="font-semibold text-gray-700">{reset.maskedEmail}</span>
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-gray-500">
                        OTP will be sent to your logged-in email.
                      </p>
                    )}

                    {reset.error && (
                      <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {reset.error}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={disableDeleteButton}
                      onClick={handleContinue}
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                        disableDeleteButton
                          ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                          : 'bg-red-600 text-white border-red-700 hover:bg-red-700 hover:-translate-y-[1px]'
                      }`}
                    >
                      {reset.loadingSendOtp ? 'Sending OTP...' : 'Continue'}
                    </button>
                  </div>
                </>
              )}

              {reset.step === 'verify' && (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">OTP Verification</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Sent to: <span className="font-semibold text-gray-800">{reset.maskedEmail}</span>
                        </div>
                      </div>
                    </div>

                    {reset.lastSentAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resend OTP available after 30 seconds.
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Enter 6-digit OTP
                    </label>
                    <input
                      inputMode="numeric"
                      value={reset.typedOtp}
                      onChange={(e) =>
                        setReset((prev) => ({
                          ...prev,
                          typedOtp: e.target.value.replace(/\D/g, '').slice(0, 6),
                          error: undefined,
                        }))
                      }
                      placeholder="______"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20"
                    />

                    {reset.error && (
                      <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {reset.error}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <button
                        type="button"
                        disabled={!canResendOtp || reset.loadingSendOtp}
                        onClick={sendOtp}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          !canResendOtp || reset.loadingSendOtp
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:-translate-y-[1px]'
                        }`}
                      >
                        {reset.loadingSendOtp ? 'Resending...' : 'Resend OTP'}
                      </button>

                      <button
                        type="button"
                        disabled={reset.loadingReset}
                        onClick={handleVerifyAndReset}
                        className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                          reset.loadingReset
                            ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                            : 'bg-red-600 text-white border-red-700 hover:bg-red-700 hover:-translate-y-[1px]'
                        }`}
                      >
                        {reset.loadingReset ? 'Deleting...' : 'Delete everything'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {reset.step === 'busy' && (
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-600/10 border border-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-700" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">Deleting your data...</p>
                  <p className="mt-1 text-xs text-gray-600">This will take a moment.</p>
                </div>
              )}

              {reset.step === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {reset.error || 'Something went wrong.'}
                </div>
              )}

              {reset.step === 'done' && (
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600/10 border border-emerald-600 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-700" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-gray-900">Reset complete</p>
                  <p className="mt-1 text-xs text-gray-600">Reloading is not required. Your app should now be empty.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

