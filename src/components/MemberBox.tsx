import { Check } from "lucide-react";

import { useChitFund } from "../context/ChitFundContext";

interface MemberBoxProps {
  memberId: string;
  month: number;
  year: number;
  onClick: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}

export function MemberBox({
  memberId,
  month,
  year,
  onClick,
  selectMode = false,
  selected = false,
  onToggle,
}: MemberBoxProps) {
  const { state, hasMemberPaid } = useChitFund();
  const member = state.members.find((m) => m.id === memberId);
  const isPaid = hasMemberPaid(memberId, month, year);

  if (!member) return null;

  return (
    <button
      onClick={() => {
        if (selectMode) {
          onToggle?.();
          return;
        }
        onClick();
      }}
      className={`
        admin-card admin-lift admin-press group relative flex min-h-[90px] w-full cursor-pointer
        flex-col items-center justify-center overflow-hidden p-4
        ${
          isPaid
            ? "status-paid hover:border-emerald-300 hover:bg-emerald-100/80"
            : "status-pending hover:border-red-300 hover:bg-red-100/80"
        }
        ${selected ? "ring-4 ring-blue-500 ring-offset-2" : ""}
        focus:outline-none focus:ring-4 focus:ring-blue-100 focus:ring-offset-2
      `}
    >
      {selectMode && (
        <span
          className={`admin-transition absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-md border transition-[background-color,border-color,color,transform] ${
            selected
              ? "scale-105 border-blue-600 bg-blue-600 text-white shadow-sm"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>
      )}

      <div className="admin-transition absolute inset-x-0 top-0 h-1 bg-current opacity-20 transition-opacity group-hover:opacity-30" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <span className="text-sm font-black tracking-wide">{member.id}</span>
        <span className="mt-1.5 w-full truncate text-center text-xs font-medium leading-tight">
          {member.name.length > 12
            ? `${member.name.slice(0, 12)}...`
            : member.name}
        </span>

        <div
          className={`admin-transition mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm transition-[background-color,color,transform] group-hover:scale-[1.03] ${
            isPaid ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {isPaid ? "Paid" : "Due"}
        </div>
      </div>
    </button>
  );
}
