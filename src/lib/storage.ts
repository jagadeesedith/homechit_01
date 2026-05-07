import type { Member, MonthlyPayment, Distribution, Settings } from '@/types';

const KEYS = {
  members: 'chit_fund_members',
  payments: 'chit_fund_payments',
  distributions: 'chit_fund_distributions',
  settings: 'chit_fund_settings',
  auth: 'chit_fund_auth',
} as const;

export function getMembers(): Member[] {
  try {
    const data = localStorage.getItem(KEYS.members);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setMembers(members: Member[]): void {
  localStorage.setItem(KEYS.members, JSON.stringify(members));
}

export function getPayments(): MonthlyPayment[] {
  try {
    const data = localStorage.getItem(KEYS.payments);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setPayments(payments: MonthlyPayment[]): void {
  localStorage.setItem(KEYS.payments, JSON.stringify(payments));
}

export function getDistributions(): Distribution[] {
  try {
    const data = localStorage.getItem(KEYS.distributions);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setDistributions(distributions: Distribution[]): void {
  localStorage.setItem(KEYS.distributions, JSON.stringify(distributions));
}

export function getSettings(): Settings | null {
  try {
    const data = localStorage.getItem(KEYS.settings);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setSettings(settings: Settings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(KEYS.auth) === 'true';
}

export function setAuthenticated(value: boolean): void {
  localStorage.setItem(KEYS.auth, String(value));
}

export function logout(): void {
  localStorage.removeItem(KEYS.auth);
}

export function seedInitialData(): void {
  const existingMembers = getMembers();
  if (existingMembers.length === 0) {
    const defaultSettings: Settings = {
      firstMonthAmount: 2000,
      monthlyAmount: 500,
      interestRate: 2,
      durationMonths: 36,
      totalMembers: 60,
    };
    setSettings(defaultSettings);

    const members: Member[] = Array.from({ length: 60 }, (_, i) => {
      const num = i + 1;
      return {
        id: `M${num.toString().padStart(2, '0')}`,
        name: `Member ${num.toString().padStart(2, '0')}`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        joinDate: new Date().toISOString().split('T')[0],
        balance: 0,
      };
    });
    setMembers(members);
    setPayments([]);
    setDistributions([]);
  }
}
