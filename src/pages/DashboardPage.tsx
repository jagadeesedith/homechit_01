import { useMemo, useState } from "react";
import { SummaryCards } from "@/components/SummaryCards";
import { MemberGrid } from "@/components/MemberGrid";
import { PaymentModal } from "@/components/PaymentModal";
import {
  SmartMemberFinder,
  type FinderMode,
} from "@/components/SmartMemberFinder";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MONTHS } from "@/types";
import { useChitFund } from "../context/ChitFundContext";
import { Calendar, ChevronDown, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function DashboardPage() {
  const {
    state,
    markAllPaidForMonth,
    markMembersPaidForMonth,
    setSelectedMonthYear,
    hasMemberPaid,
  } = useChitFund();
  const month = state.selectedMonth;
  const year = state.selectedYear;
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [finderMode, setFinderMode] = useState<FinderMode>("groups");
  const [activeGroupStart, setActiveGroupStart] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const handleMarkAllPaid = async () => {
    await markAllPaidForMonth(month, year);
  };

  const sortedMembers = useMemo(
    () =>
      [...state.members].sort((a, b) => {
        const aNumber = Number(a.id);
        const bNumber = Number(b.id);
        if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
          return aNumber - bNumber;
        }
        return a.id.localeCompare(b.id);
      }),
    [state.members],
  );
  const maxMemberNumber = useMemo(
    () =>
      Math.max(
        0,
        ...sortedMembers
          .map((member) => Number(member.id))
          .filter((id) => Number.isFinite(id)),
      ),
    [sortedMembers],
  );

  const visibleMembers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const phoneQuery = searchQuery.replace(/\D/g, "");

    if (query) {
      return sortedMembers.filter((member) => {
        const phone = (member.phone || "").replace(/\D/g, "");
        return (
          member.id.toLocaleLowerCase().includes(query) ||
          member.name.toLocaleLowerCase().includes(query) ||
          (!!phoneQuery && phone.includes(phoneQuery))
        );
      });
    }

    if (finderMode === "groups" && activeGroupStart !== null) {
      return sortedMembers.filter((member) => {
        const memberNumber = Number(member.id);
        return (
          Number.isFinite(memberNumber) &&
          memberNumber >= activeGroupStart &&
          memberNumber <= activeGroupStart + 9
        );
      });
    }

    return sortedMembers;
  }, [activeGroupStart, finderMode, searchQuery, sortedMembers]);

  const selectedFilterLabel = useMemo(() => {
    if (searchQuery.trim()) return "Search results";
    if (finderMode === "all") return "All members";
    if (activeGroupStart !== null) {
      return `${activeGroupStart}-${Math.min(activeGroupStart + 9, maxMemberNumber)}`;
    }
    return "All members";
  }, [activeGroupStart, finderMode, maxMemberNumber, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) setActiveGroupStart(null);
  };

  const handleFinderModeChange = (mode: FinderMode) => {
    setFinderMode(mode);
    setActiveGroupStart(null);
    if (mode === "all") setSearchQuery("");
  };

  const handleActiveGroupChange = (groupStart: number | null) => {
    setActiveGroupStart(groupStart);
    if (groupStart !== null) {
      setFinderMode("groups");
      setSearchQuery("");
    }
  };

  const openMember = (memberId: string) => {
    setSelectedMember(memberId);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleToggleSelectMode = () => {
    setSelectMode((current) => !current);
    setSelectedMemberIds(new Set());
  };

  const clearSelection = () => {
    setSelectedMemberIds(new Set());
  };

  const handleBatchMarkPaid = async () => {
    try {
      const markedCount = await markMembersPaidForMonth(
        Array.from(selectedMemberIds),
        month,
        year,
      );

      clearSelection();
      setShowBatchConfirm(false);

      if (markedCount === 0) {
        toast.info("Selected members are already paid");
        return;
      }

      toast.success(
        `Marked ${markedCount} member${markedCount === 1 ? "" : "s"} as paid`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Could not mark selected members as paid");
    }
  };

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(2024, state.settings.startYear, currentYear - 2);
  const maxYear = Math.max(currentYear + 5, state.settings.startYear + 5);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header Section */}
      <div className="admin-enter mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  {MONTHS[month - 1]} {year}
                </h1>
                <p className="text-gray-600 text-sm font-medium">
                  Dashboard Overview
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{state.members.length} Members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Active Period</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Month Selector */}
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setSelectedMonthYear(Number(e.target.value), year)}
                className="admin-input appearance-none px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300"
              >
                {MONTHS.map((m, index) => (
                  <option key={m} value={index + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Year Selector */}
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setSelectedMonthYear(month, Number(e.target.value))}
                className="admin-input appearance-none px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Mark All Paid */}
            <button className="admin-button admin-press bg-gray-600 px-6 py-3 text-white shadow-[0_10px_24px_rgba(75,85,99,0.18)] hover:bg-gray-700">
            <a
  href="/apk/homechit.apk"
  download
  className="admin-button admin-press bg-blue-600 px-6 py-3 text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] hover:bg-blue-700"
>
  📱 Install App
</a></button>
            <button
              onClick={handleMarkAllPaid}
              className="admin-button admin-press bg-emerald-600 px-6 py-3 text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)] hover:bg-emerald-700"
            >
              <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              Mark All Paid
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 font-medium">
              💡 Click on any member card below to record their payment for this month
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Live Data
            </div>
          </div>
        </div>
      </div>

      <SmartMemberFinder
        members={sortedMembers}
        month={month}
        year={year}
        searchQuery={searchQuery}
        selectMode={selectMode}
        mode={finderMode}
        activeGroupStart={activeGroupStart}
        onSearchQueryChange={handleSearchChange}
        onModeChange={handleFinderModeChange}
        onActiveGroupStartChange={handleActiveGroupChange}
        hasMemberPaid={hasMemberPaid}
        onToggleSelectMode={handleToggleSelectMode}
      />

      <div className="admin-enter" style={{ animationDelay: "80ms" }}>
        <SummaryCards month={month} year={year} />
      </div>

      <div className="admin-enter mt-8" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Member Payment Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedFilterLabel} - {visibleMembers.length} member
              {visibleMembers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <MemberGrid
          month={month}
          year={year}
          members={visibleMembers}
          selectMode={selectMode}
          selectedMemberIds={selectedMemberIds}
          onOpenMember={openMember}
          onToggleMember={toggleMemberSelection}
        />
      </div>

      {selectedMember && (
        <PaymentModal
          memberId={selectedMember}
          month={month}
          year={year}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {selectMode && selectedMemberIds.size > 0 && (
        <div className="admin-slide-up fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-14px_36px_rgba(15,23,42,0.12)] backdrop-blur lg:left-[280px]">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected
              </p>
              <p className="text-lg font-black text-slate-950">
                {selectedMemberIds.size}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="admin-button admin-press border border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => setShowBatchConfirm(true)}
              className="admin-button admin-press bg-emerald-600 px-5 font-black text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] hover:bg-emerald-700"
            >
              Mark Paid
            </button>
          </div>
        </div>
      )}

      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark {selectedMemberIds.size} members as paid?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will record the monthly contribution for the selected members
              for {MONTHS[month - 1]} {year}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchMarkPaid}
              className="admin-transition bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
