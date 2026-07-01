import { useMemo, useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { formatINR, memberWaLink, memberSmsLink } from '@/lib/utils';
import { getMonthAmount } from '@/lib/payment';
import { MONTHS } from '@/types';
import {
  AlertTriangle,
  MessageCircle,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Users,
  CalendarDays,
  Gauge,
  IndianRupee,
} from 'lucide-react';

type SortKey = 'id' | 'name' | 'missedMonths' | 'totalOwed' | 'lastPaidDate';

interface MemberRow {
  id: string;
  name: string;
  phone: string;
  paidMonths: number;
  missedMonths: number;
  totalOwed: number;
  lastPaidDate: string;
}

export function OverduePage() {
  const { state } = useChitFund();
  const [sortKey, setSortKey] = useState<SortKey>('missedMonths');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const {
    expectedMonthsSoFar,
    rows,
    totalDefaulters,
    totalAmountOwed,
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const { startMonth, startYear } = state.settings;

    const expectedMonthsSoFar = Math.max(0,
      (currentYear * 12 + currentMonth) - (startYear * 12 + startMonth) + 1,
    );

    const rows: MemberRow[] = state.members.map((member) => {
      const memberPayments = state.payments.filter(
        (p) => p.memberId === member.id,
      );

      const paidSet = new Set(
        memberPayments.map((p) => `${p.month}-${p.year}`),
      );
      const paidMonths = paidSet.size;
      const missedMonths = Math.max(0, expectedMonthsSoFar - paidMonths);

      let totalOwed = 0;
      for (let y = startYear; y <= currentYear; y++) {
        const startM = y === startYear ? startMonth : 1;
        const endM = y === currentYear ? currentMonth : 12;
        for (let m = startM; m <= endM; m++) {
          if (!paidSet.has(`${m}-${y}`)) {
            totalOwed += getMonthAmount(m, y, state.settings);
          }
        }
      }

      const dates = memberPayments
        .map((p) => p.paidAt)
        .filter(Boolean)
        .sort()
        .reverse();
      const lastPaidDate = dates.length > 0 ? dates[0] : 'Never';

      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        paidMonths,
        missedMonths,
        totalOwed,
        lastPaidDate,
      };
    });

    const totalDefaulters = rows.filter((r) => r.missedMonths > 0).length;
    const totalAmountOwed = rows.reduce((sum, r) => sum + r.totalOwed, 0);

    return { expectedMonthsSoFar, rows, totalDefaulters, totalAmountOwed };
  }, [state.members, state.payments, state.settings]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id':
          cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'missedMonths':
          cmp = a.missedMonths - b.missedMonths;
          break;
        case 'totalOwed':
          cmp = a.totalOwed - b.totalOwed;
          break;
        case 'lastPaidDate': {
          if (a.lastPaidDate === 'Never' && b.lastPaidDate === 'Never') cmp = 0;
          else if (a.lastPaidDate === 'Never') cmp = 1;
          else if (b.lastPaidDate === 'Never') cmp = -1;
          else cmp = a.lastPaidDate.localeCompare(b.lastPaidDate);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const formatLastPaid = (dateStr: string): string => {
    if (dateStr === 'Never') return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (expectedMonthsSoFar === 0) {
    return (
      <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Overdue Report
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Member defaulter analysis across all months
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-12 text-center">
          <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Chit hasn't started yet
          </h3>
          <p className="text-gray-500">
            The chit period begins {MONTHS[state.settings.startMonth - 1]}{' '}
            {state.settings.startYear}. No data to report yet.
          </p>
        </div>
      </div>
    );
  }

  const buildReminderText = (row: MemberRow) =>
    `Dear ${row.name}, you have ${row.missedMonths} missed payment(s) totalling ${formatINR(row.totalOwed)}. Please clear at the earliest. - HomeChit`;

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Overdue Report
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              Member defaulter analysis across all months
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">
              Total Members
            </p>
            <p className="text-3xl font-black text-white">
              {state.members.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">
              Expected Months
            </p>
            <p className="text-3xl font-black text-white">
              {expectedMonthsSoFar}
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Gauge className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-rose-100 text-sm font-medium mb-1">
              Total Defaulters
            </p>
            <p className="text-3xl font-black text-white">
              {totalDefaulters}
            </p>
            <p className="text-rose-200 text-xs mt-2">
              {state.members.length > 0
                ? Math.round((totalDefaulters / state.members.length) * 100)
                : 0}
              % of members
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-amber-100 text-sm font-medium mb-1">
              Total Amount Owed
            </p>
            <p className="text-3xl font-black text-white">
              {formatINR(totalAmountOwed)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="border-b border-gray-200">
              <SortableTh
                sortKey="id"
                label="ID"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                sortKey="name"
                label="Name"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                Phone
              </th>
              <SortableTh
                sortKey="missedMonths"
                label="Missed Months"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                sortKey="totalOwed"
                label="Total Amount Owed"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                sortKey="lastPaidDate"
                label="Last Paid Date"
                currentSort={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <th className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center"
                >
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No members found
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Add members to see overdue report
                  </p>
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const rowBg =
                  row.missedMonths >= 2
                    ? 'bg-red-50 hover:bg-red-100/70'
                    : row.missedMonths === 1
                      ? 'bg-amber-50 hover:bg-amber-100/70'
                      : 'bg-white hover:bg-gray-50';

                const badgeStyle =
                  row.missedMonths >= 2
                    ? 'bg-red-100 text-red-800'
                    : row.missedMonths === 1
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800';

                const hasPhone =
                  row.phone.replace(/\D/g, '').length > 0;
                const reminderText = buildReminderText(row);

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors duration-150 ${rowBg}`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {row.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.phone || '\u2014'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}`}
                      >
                        {row.missedMonths}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {formatINR(row.totalOwed)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatLastPaid(row.lastPaidDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={
                            hasPhone
                              ? memberWaLink(row.phone, reminderText)
                              : '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            hasPhone
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'pointer-events-none opacity-40 text-gray-400'
                          }`}
                          title="Send WhatsApp reminder"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <a
                          href={
                            hasPhone
                              ? memberSmsLink(row.phone, reminderText)
                              : '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            hasPhone
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'pointer-events-none opacity-40 text-gray-400'
                          }`}
                          title="Send SMS reminder"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({
  sortKey: key,
  label,
  currentSort,
  currentDir,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  currentSort: SortKey;
  currentDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSort === key;
  return (
    <th
      className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4 cursor-pointer select-none hover:text-gray-900 transition-colors"
      onClick={() => onSort(key)}
    >
      {label}
      {isActive &&
        (currentDir === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5 inline-block ml-1" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 inline-block ml-1" />
        ))}
    </th>
  );
}
