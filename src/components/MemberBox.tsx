import { useChitFund } from '@/context/ChitFundContext';

interface MemberBoxProps {
  memberId: string;
  month: number;
  year: number;
  onClick: () => void;
}

export function MemberBox({ memberId, month, year, onClick }: MemberBoxProps) {
  const { state, hasMemberPaid } = useChitFund();
  const member = state.members.find(m => m.id === memberId);
  const isPaid = hasMemberPaid(memberId, month, year);

  if (!member) return null;

  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-2xl border flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 ease-in-out min-h-[80px]
        shadow-sm hover:shadow-lg hover:-translate-y-0.5
        ${isPaid
          ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-green-200 text-emerald-700 hover:from-emerald-100 hover:to-green-200'
          : 'bg-gradient-to-br from-rose-50 to-red-100 border-red-200 text-red-700 hover:from-rose-100 hover:to-red-200'
        }
        focus:outline-none focus:ring-4 focus:ring-blue-100
      `}
    >
      <span className="text-xs font-bold">{member.id}</span>
      <span className="text-xs mt-1 truncate w-full text-center">
        {member.name.length > 10 ? member.name.slice(0, 10) + '...' : member.name}
      </span>
    </button>
  );
}
