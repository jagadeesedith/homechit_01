import { useState } from 'react';
import * as XLSX from 'xlsx';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { MONTHS } from '@/types';
import { Search } from 'lucide-react';
import { auth, db } from '@/lib/firebase';

export function MemberHistoryPage() {
  const { state, getMemberPayments } = useChitFund();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const member = state.members.find(m => m.id === selectedMemberId);
  const payments = selectedMemberId ? getMemberPayments(selectedMemberId) : [];

  const importHistory = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      alert('Import Started');

      const file = e.target.files?.[0];
      if (!file) {
        alert('No file selected');
        return;
      }

      const user = auth.currentUser;

      if (!user) {
        alert('User not logged in');
        return;
      }

      const userId = user.uid;

      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(sheet);

      console.log(rows);
      alert(`Rows Found: ${(rows as unknown[]).length}`);

      for (const row of rows as Record<string, unknown>[]) {
        const memberId = String(row.MemberID || '');

        if (!memberId) continue;

        await setDoc(
          doc(db, 'users', userId, 'members', memberId),
          {
            id: memberId,
            name: String(row.Name || ''),
            phone: String(row.Phone || ''),
            joinDate: new Date().toISOString(),
            balance: Number(row.NewBalance || 0),
            active: true,
          },
          { merge: true }
        );

        await addDoc(
          collection(db, 'users', userId, 'payments'),
          {
            memberId,
            month: Number(row.Month || 0),
            year: Number(row.Year || 0),
            previousBalance: Number(row.PreviousBalance || 0),
            contribution: Number(row.ChitAmount || 0),
            principalPaid: Number(row.PrincipalPaid || 0),
            interest: Number(row.Interest || 0),
            totalPaid: Number(row.TotalPaid || 0),
            newBalance: Number(row.NewBalance || 0),
            paidAt: new Date().toISOString(),
          }
        );
      }

      alert('Import Success ✅');
      e.target.value = '';
      window.location.reload();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      alert('Error: ' + message);
    }
  };

  const totalPaidToDate = payments.reduce((s, p) => s + p.totalPaid, 0);
  const monthsActive = payments.length;

  const filteredMembers = state.members.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-[#1d1d1d]">Member History</h1>

        <label className="bg-green-600 text-white px-4 py-3 rounded-lg cursor-pointer hover:bg-green-700 text-center w-full sm:w-auto flex items-center justify-center">
          Import History
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={importHistory}
          />
        </label>
      </div>

      <div className="bg-white rounded-lg border border-[#e9ecef] p-6 mb-6">
        <label className="block text-sm font-medium text-[#1d1d1d] mb-2">Select Member</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedMemberId('');
            }}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#e9ecef] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
          />
        </div>

        {searchQuery && !selectedMemberId && (
          <div className="mt-2 border border-[#e9ecef] rounded-lg max-h-48 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <p className="p-3 text-sm text-[#6c757d]">No members found</p>
            ) : (
              filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setSearchQuery(`${m.id} - ${m.name}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1d1d1d] hover:bg-[#f8f9fa] border-b border-[#e9ecef] last:border-0 transition-colors"
                >
                  <span className="font-medium">{m.id}</span> - {m.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {member && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Current Balance</p>
              <p className="text-xl font-bold text-[#1d1d1d] mt-1">{formatINR(member.balance)}</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Months Active</p>
              <p className="text-xl font-bold text-[#1d1d1d] mt-1">{monthsActive}</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#e9ecef]">
              <p className="text-xs text-[#6c757d] font-medium uppercase">Total Paid to Date</p>
              <p className="text-xl font-bold text-[#004b87] mt-1">{formatINR(totalPaidToDate)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e9ecef] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e9ecef]">
                    <th className="text-left text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Month</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Last Balance</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Contribution</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Principal</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Interest</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">Total Paid</th>
                    <th className="text-right text-xs font-semibold text-[#6c757d] uppercase tracking-wider px-4 py-3">New Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6c757d]">
                        No payment history found for this member
                      </td>
                    </tr>
                  ) : (
                    payments.map(payment => (
                      <tr
                        key={payment.id}
                        className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-[#1d1d1d]">
                          {MONTHS[payment.month - 1]} {payment.year}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">
                          {formatINR(payment.newBalance + payment.principalPaid)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">
                          {formatINR(payment.contribution)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">
                          {formatINR(payment.principalPaid)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right">
                          {formatINR(payment.interest)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d1d1d] text-right font-medium">
                          {formatINR(payment.totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#004b87] text-right font-medium">
                          {formatINR(payment.newBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

