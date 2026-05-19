import { useMemo } from "react";
import { Search } from "lucide-react";

import type { Member } from "@/types";

type FinderMode = "groups" | "all";

interface SmartMemberFinderProps {
  members: Member[];
  month: number;
  year: number;
  searchQuery: string;
  selectMode: boolean;
  mode: FinderMode;
  activeGroupStart: number | null;
  onSearchQueryChange: (query: string) => void;
  onModeChange: (mode: FinderMode) => void;
  onActiveGroupStartChange: (groupStart: number | null) => void;
  hasMemberPaid: (memberId: string, month: number, year: number) => boolean;
  onToggleSelectMode: () => void;
}

function numericMemberId(member: Member) {
  const value = Number(member.id);
  return Number.isFinite(value) ? value : null;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export type { FinderMode };

export function SmartMemberFinder({
  members,
  month,
  year,
  searchQuery,
  selectMode,
  mode,
  activeGroupStart,
  onSearchQueryChange,
  onModeChange,
  onActiveGroupStartChange,
  hasMemberPaid,
  onToggleSelectMode,
}: SmartMemberFinderProps) {
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const aNumber = numericMemberId(a);
        const bNumber = numericMemberId(b);
        if (aNumber !== null && bNumber !== null) return aNumber - bNumber;
        return a.id.localeCompare(b.id);
      }),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const query = normalize(searchQuery);
    const phoneQuery = normalizePhone(searchQuery);

    if (!query) return sortedMembers;

    return sortedMembers.filter((member) => {
      const id = normalize(member.id);
      const name = normalize(member.name);
      const phone = normalizePhone(member.phone || "");

      return (
        id.includes(query) ||
        name.includes(query) ||
        (!!phoneQuery && phone.includes(phoneQuery))
      );
    });
  }, [searchQuery, sortedMembers]);

  const groups = useMemo(() => {
    const numericIds = sortedMembers
      .map(numericMemberId)
      .filter((id): id is number => id !== null);

    const maxId = Math.max(0, ...numericIds);
    const result: { start: number; end: number; label: string; pending: number }[] = [];

    for (let start = 1; start <= maxId; start += 10) {
      const end = Math.min(start + 9, maxId);
      const groupMembers = sortedMembers.filter((member) => {
        const id = numericMemberId(member);
        return id !== null && id >= start && id <= end;
      });

      if (groupMembers.length === 0) continue;

      result.push({
        start,
        end,
        label: `${start}-${end}`,
        pending: groupMembers.filter(
          (member) => !hasMemberPaid(member.id, month, year),
        ).length,
      });
    }

    return result;
  }, [hasMemberPaid, month, sortedMembers, year]);

  const visibleCount = filteredMembers.length;

  return (
    <section className="admin-surface admin-enter mb-6 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(event) => {
              onSearchQueryChange(event.target.value);
              if (event.target.value.trim()) onActiveGroupStartChange(null);
            }}
            placeholder="Search number / phone"
            className="admin-input h-[52px] w-full py-3 pl-12 pr-4 text-base font-semibold"
          />
        </div>

        <button
          type="button"
          onClick={onToggleSelectMode}
          className={`admin-button admin-press h-[52px] px-5 ${
            selectMode
              ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
              : "bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] hover:bg-blue-700"
          }`}
        >
          {selectMode ? "Exit Select" : "Select Mode"}
        </button>
      </div>

      <div className="mt-4 flex rounded-xl bg-slate-100 p-1 shadow-inner shadow-slate-200/60">
        {(["groups", "all"] as FinderMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              onModeChange(item);
              onActiveGroupStartChange(null);
            }}
            className={`admin-press admin-transition h-11 flex-1 rounded-lg text-sm font-bold transition-[transform,background-color,box-shadow,color] ${
              mode === item
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {item === "groups" ? "Groups" : "All"}
          </button>
        ))}
      </div>

      {!searchQuery.trim() && mode === "groups" && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => (
            <button
              key={group.start}
              type="button"
              onClick={() => onActiveGroupStartChange(group.start)}
              className={`admin-press admin-transition min-h-14 rounded-xl border px-4 py-3 text-left transition-[transform,background-color,border-color,box-shadow] ${
                activeGroupStart === group.start
                  ? "border-blue-500 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]"
                  : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
              }`}
            >
              <span
                className={`block text-lg font-black ${
                  activeGroupStart === group.start
                    ? "text-blue-900"
                    : "text-slate-950"
                }`}
              >
                {group.label}
              </span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                {group.pending} pending
              </span>
            </button>
          ))}
        </div>
      )}

      {searchQuery.trim() && (
        <div className="admin-enter-fast mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          Showing {visibleCount} result{visibleCount === 1 ? "" : "s"} below
        </div>
      )}
    </section>
  );
}
