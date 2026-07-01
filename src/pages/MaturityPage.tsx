import { useMemo } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { formatINR } from '@/lib/utils';
import { Trophy, Users, Banknote, CheckCircle, XCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function MaturityPage() {
  const {
    state,
    getMemberOutstandingBalance,
  } = useChitFund();

  const sortedMembers = useMemo(
    () => [...state.members].sort((a, b) => parseInt(a.id) - parseInt(b.id)),
    [state.members],
  );

  const memberContributions = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of state.payments) {
      map[p.memberId] = (map[p.memberId] || 0) + p.contribution;
    }
    return map;
  }, [state.payments]);

  const totalContributed = useMemo(
    () => Object.values(memberContributions).reduce((s, v) => s + v, 0),
    [memberContributions],
  );

  const memberStatuses = useMemo(() => {
    const map: Record<string, { outstanding: number; settled: boolean }> = {};
    for (const m of state.members) {
      const outstanding = getMemberOutstandingBalance(m.id);
      map[m.id] = { outstanding, settled: outstanding === 0 };
    }
    return map;
  }, [state.members, getMemberOutstandingBalance]);

  const settledCount = useMemo(
    () => Object.values(memberStatuses).filter((s) => s.settled).length,
    [memberStatuses],
  );

  const totalMembers = state.members.length;

  const handleExportExcel = () => {
    try {
      const rows = sortedMembers.map((m) => {
        const contributed = memberContributions[m.id] || 0;
        const { outstanding, settled } = memberStatuses[m.id] || { outstanding: 0, settled: true };
        return {
          'Member ID': m.id,
          Name: m.name,
          Phone: m.phone,
          'Contributed So Far': `₹${(contributed).toLocaleString('en-IN')}`,
          'Outstanding Balance': `₹${(outstanding).toLocaleString('en-IN')}`,
          Status: settled ? 'Settled' : 'Pending',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Maturity');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Maturity_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export complete');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Maturity Settlement</h1>
            <p className="text-gray-600 text-sm font-medium">Final settlement overview for all members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Members</p>
            <p className="text-3xl font-black text-white">{totalMembers}</p>
            <p className="text-blue-200 text-xs mt-2">Registered members in the chit</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Contributed</p>
            <p className="text-3xl font-black text-white">{formatINR(totalContributed)}</p>
            <p className="text-emerald-200 text-xs mt-2">Sum of all contributions</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Maturity Status</p>
            <p className="text-3xl font-black text-white">{settledCount} / {totalMembers}</p>
            <p className="text-purple-200 text-xs mt-2">
              {totalMembers > 0 ? `${Math.round((settledCount / totalMembers) * 100)}% settled` : 'No members'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Member Settlement Details</h3>
                <p className="text-sm text-gray-600">Contribution and outstanding summary for each member</p>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Member ID</th>
                  <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Name</th>
                  <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Phone</th>
                  <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Contributed So Far</th>
                  <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Outstanding Balance</th>
                  <th className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No members found</p>
                      <p className="text-gray-400 text-sm mt-1">Add members to view settlement details</p>
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((member, index) => {
                    const contributed = memberContributions[member.id] || 0;
                    const { outstanding, settled } = memberStatuses[member.id] || { outstanding: 0, settled: true };
                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{member.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{member.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.phone}</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatINR(contributed)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right">{formatINR(outstanding)}</td>
                        <td className="px-6 py-4 text-center">
                          {settled ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                              <XCircle className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
