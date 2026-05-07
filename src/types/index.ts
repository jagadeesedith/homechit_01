export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  balance: number;
}

export interface MonthlyPayment {
  id: string;
  memberId: string;
  month: number;
  year: number;
  contribution: number;
  principalPaid: number;
  interest: number;
  totalPaid: number;
  newBalance: number;
  paidAt: string;
}

export interface Distribution {
  id: string;
  memberId: string;
  month: number;
  year: number;
  amount: number;
  givenAt: string;
}

export interface Settings {
  firstMonthAmount: number;
  monthlyAmount: number;
  interestRate: number;
  durationMonths: number;
  totalMembers: number;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export type Month = typeof MONTHS[number];
