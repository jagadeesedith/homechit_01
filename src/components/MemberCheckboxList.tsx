import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { filterMembers } from "@/lib/utils";
import type { Member } from "@/types";

interface MemberCheckboxListProps {
  members: Member[];
  selected: Set<string>;
  onToggle: (memberId: string) => void;
  memberAmounts: Record<string, string>;
  onAmountChange: (memberId: string, amount: string) => void;
}

export function MemberCheckboxList({
  members,
  selected,
  onToggle,
  memberAmounts,
  onAmountChange,
}: MemberCheckboxListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterMembers(members, query),
    [members, query],
  );

  return (
    <div>
      <div className="relative p-2 border-b border-gray-100">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type ID, name or phone..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            No members match "{query}"
          </div>
        ) : (
          filtered.map((m) => {
            const isSelected = selected.has(m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors ${
                  isSelected ? "bg-orange-50" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(m.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-orange-500 border-orange-500"
                      : "border-gray-300 hover:border-orange-400"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0 w-10">
                  {m.id}
                </span>
                <span className="text-sm text-gray-600 truncate flex-1 min-w-0">
                  {m.name}
                </span>
                {isSelected && (
                  <div className="relative w-24 flex-shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      value={memberAmounts[m.id] || ""}
                      onChange={(e) => onAmountChange(m.id, e.target.value)}
                      className="w-full pl-5 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                      placeholder="Amount"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
