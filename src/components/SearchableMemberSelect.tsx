import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { filterMembers, formatINR } from "@/lib/utils";
import type { Member } from "@/types";

interface SearchableMemberSelectProps {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  placeholder?: string;
  className?: string;
  memberBalances?: Map<string, number>;
}

export function SearchableMemberSelect({
  members,
  value,
  onChange,
  placeholder = "Search member...",
  className = "",
  memberBalances,
}: SearchableMemberSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => members.find((m) => m.id === value),
    [members, value],
  );

  const filtered = useMemo(
    () => filterMembers(members, query),
    [members, query],
  );

  const showSearch = members.length > 10;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (memberId: string) => {
    onChange(memberId);
    setOpen(false);
  };

  if (!showSearch) {
    return (
      <div className={className}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          required
        >
          <option value="">{placeholder || "Choose a member"}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} - {m.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); }
        }}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all duration-200 cursor-pointer flex items-center justify-between"
      >
        {selected ? (
          <span>{selected.id} - {selected.name}</span>
        ) : (
          <span className="text-gray-400">{placeholder || "Choose a member"}</span>
        )}
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type ID, name or phone..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                No members match "{query}"
              </div>
            ) : (
              filtered.map((m) => {
                const isSelected = m.id === value;
                const balance = memberBalances?.get(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors ${
                      isSelected ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected && (
                        <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-gray-900">
                        {m.id}
                      </span>
                      <span className="text-sm text-gray-600 truncate">
                        {m.name}
                      </span>
                    </div>
                    {balance !== undefined && (
                      <span className="text-xs font-medium text-gray-400 flex-shrink-0 ml-2">
                        {formatINR(balance)}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
