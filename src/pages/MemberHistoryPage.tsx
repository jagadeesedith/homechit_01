import { useState } from "react";
import * as XLSX from "xlsx";
import { doc, setDoc } from "firebase/firestore";
import { useChitFund } from "../context/ChitFundContext";
import { formatINR } from "@/lib/utils";
import { MONTHS } from "@/types";
import {
  Search,
  User,
  DollarSign,
  TrendingUp,
  Upload,
  FileText,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

export function MemberHistoryPage() {
  const { state, getMemberPayments, reloadFromFirestore } = useChitFund();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const member = state.members.find((m) => m.id === selectedMemberId);
  const payments = selectedMemberId ? getMemberPayments(selectedMemberId) : [];

  const sortedMembers = [...state.members].sort(
    (a, b) => parseInt(a.id) - parseInt(b.id),
  );

  const currentMemberIndex = sortedMembers.findIndex(
    (m) => m.id === selectedMemberId,
  );

  const goToPreviousMember = () => {
    if (currentMemberIndex > 0) {
      const prevMember = sortedMembers[currentMemberIndex - 1];

      setSelectedMemberId(prevMember.id);
      setSearchQuery("");
    }
  };

  const goToNextMember = () => {
    if (currentMemberIndex < sortedMembers.length - 1) {
      const nextMember = sortedMembers[currentMemberIndex + 1];

      setSelectedMemberId(nextMember.id);
      setSearchQuery("");
    }
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;

    const isLeftSwipe = distance > minSwipeDistance;

    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextMember();
    }

    if (isRightSwipe) {
      goToPreviousMember();
    }
  };

  const importHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      alert("Import Started");

      const files = Array.from(e.target.files || []);

      if (!files || files.length === 0) {
        alert("No file selected");
        return;
      }

      const user = auth.currentUser;

      if (!user) {
        alert("User not logged in");
        return;
      }

      const userId = user.uid;

      const parseMonthField = (monthValue: unknown) => {
        let month = 0;
        let year = 0;

        if (typeof monthValue === "number") {
          const parsedDate = XLSX.SSF.parse_date_code(monthValue);

          if (parsedDate) {
            month = parsedDate.m;
            year = parsedDate.y;
          }
        } else if (typeof monthValue === "string") {
          const date = new Date(monthValue);

          if (!isNaN(date.getTime())) {
            month = date.getMonth() + 1;
            year = date.getFullYear();
          }
        }

        return { month, year };
      };

      // Loop through all selected files
      for (const file of files) {
        alert(`Importing ${file.name}`);

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        for (const row of rows as Record<string, unknown>[]) {
          const memberId = String(row.memberID || "").trim();

          if (!memberId) continue;

          const { month, year } = parseMonthField(row.Month);

          if (!month || !year) continue;

          const paymentId = `${year}-${month}-${memberId}`;

          await setDoc(
            doc(db, "users", userId, "payments", paymentId),
            {
              id: paymentId,
              memberId,
              month,
              year,

              previousBalance: isNaN(Number(row.PreviousBalance))
                ? 0
                : Number(row.PreviousBalance),

              contribution: Number(row.distribution || 0),

              principalPaid: isNaN(Number(row.PrincipalPaid))
                ? 0
                : Number(row.PrincipalPaid),

              interest: isNaN(Number(row.Interest)) ? 0 : Number(row.Interest),

              totalPaid: isNaN(Number(row.TotalPaid))
                ? 0
                : Number(row.TotalPaid),

              newBalance: isNaN(Number(row.NewBalance))
                ? 0
                : Number(row.NewBalance),

              paidAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }
      }

      alert("All Excel Files Imported Successfully ✅");

      e.target.value = "";

      await reloadFromFirestore();
    } catch (error) {
      console.error(error);

      const message = error instanceof Error ? error.message : String(error);

      alert("Import Error: " + message);
    }
  };

  const totalPaidToDate = payments.reduce((s, p) => s + p.totalPaid, 0);
  const monthsActive = payments.length;

  const filteredMembers = [...state.members]
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
    .filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <div className="pt-16 lg:pt-0 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Member History
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Track individual member payment records
              </p>
            </div>
          </div>

          <label className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl cursor-pointer hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium">
            <Upload className="w-4 h-4" />
            Import History
            <input
              type="file"
              accept=".xlsx,.xls"
              multiple
              hidden
              onChange={importHistory}
            />
          </label>
        </div>

        {/* Member Search Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Select Member
            </h3>
            <p className="text-sm text-gray-600">
              Search by member ID or name to view detailed history
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedMemberId("");
              }}
              placeholder="Search by name or ID..."
              className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-sm font-medium"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">All Members</h3>
            <p className="text-sm text-gray-600">
              Click member to view payment history
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl max-h-[400px] overflow-y-auto bg-white">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No members found</p>
              </div>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setSearchQuery(`${m.id} - ${m.name}`);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-600" />
                    </div>

                    <div>
                      <span className="font-semibold">{m.id}</span>
                      <span className="text-gray-500 ml-2">{m.name}</span>
                    </div>
                  </div>

                  <div className="group flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-2 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <FileText className="w-4 h-4 group-hover:rotate-6 transition-transform duration-300" />
                    <span className="text-sm font-semibold">View History</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {member && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Member Info & Stats */}
          <div className="xl:col-span-1 space-y-6">
            {/* Member Profile Card */}
            <div
              className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 shadow-xl text-white"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPreviousMember}
                      className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>

                    <div className="text-center flex-1">
                      <h3 className="text-xl font-bold">{member.name}</h3>
                    </div>

                    <button
                      onClick={goToNextMember}
                      className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-teal-100 text-sm font-medium">
                    ID: {member.id}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <p className="text-teal-100 text-xs font-medium">Phone</p>
                  <p className="text-white font-semibold text-sm mt-1">
                    {member.phone}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <p className="text-teal-100 text-xs font-medium">Status</p>
                  <p className="text-white font-semibold text-sm mt-1">
                    Active
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-black text-gray-900">
                    {formatINR(member.balance)}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Current Balance
                </p>
                <p className="text-xs text-gray-500 mt-1">Outstanding amount</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-black text-gray-900">
                    {monthsActive}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700">Months Active</p>
                <p className="text-xs text-gray-500 mt-1">Payment history</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-black text-purple-900">
                    {formatINR(totalPaidToDate)}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Total Paid to Date
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Lifetime contributions
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Payment History Table */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Payment Ledger
                    </h3>
                    <p className="text-sm text-gray-600">
                      Complete payment history for {member.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>{payments.length} Records</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Month
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Last Balance
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Contribution
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Principal
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Interest
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        Total Paid
                      </th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-6 py-4">
                        New Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">
                            No payment history found
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            This member hasn't made any payments yet
                          </p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {MONTHS[payment.month - 1]} {payment.year}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-right">
                            {formatINR(
                              payment.newBalance + payment.principalPaid,
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-right">
                            {formatINR(payment.contribution)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-right">
                            {formatINR(payment.principalPaid)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 text-right">
                            {formatINR(payment.interest)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                            {formatINR(payment.totalPaid)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-teal-600 text-right">
                            {formatINR(payment.newBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
