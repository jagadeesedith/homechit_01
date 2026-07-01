import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function isFirstMonth(month: number, year: number, startMonth: number = 1, startYear: number = 2025): boolean {
  return month === startMonth && year === startYear;
}

export function filterMembers<T extends { id: string; name: string; phone?: string }>(
  members: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLocaleLowerCase();
  const phoneDigits = query.replace(/\D/g, "");

  if (!normalized) return members;

  return members.filter((member) => {
    const id = member.id.toLocaleLowerCase();
    const name = member.name.toLocaleLowerCase();
    const phone = (member.phone || "").replace(/\D/g, "");

    return (
      id.includes(normalized) ||
      name.includes(normalized) ||
      (!!phoneDigits && phone.includes(phoneDigits))
    );
  });
}

export function generateYears(startYear: number, endYear: number): number[] {
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y += 1) years.push(y);
  return years;
}

export function getYearRange(settingsStartYear: number): { minYear: number; maxYear: number } {
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(2024, settingsStartYear, currentYear - 2);
  const maxYear = Math.max(currentYear + 5, settingsStartYear + 5);
  return { minYear, maxYear };
}

export function getMonthContributionTarget(
  month: number,
  year: number,
  settings: { startMonth: number; startYear: number; firstMonthAmount: number; monthlyAmount: number; totalMembers: number },
): number {
  const isFirst = month === settings.startMonth && year === settings.startYear;
  const amount = isFirst ? settings.firstMonthAmount : settings.monthlyAmount;
  return amount * settings.totalMembers;
}

export function memberWaLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function memberSmsLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  return `sms:91${digits}?body=${encodeURIComponent(text)}`;
}
