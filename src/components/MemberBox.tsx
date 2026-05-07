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
        p-3 rounded-lg border flex flex-col items-center justify-center cursor-pointer
        transition-colors duration-200 ease-in-out min-h-[80px]
        ${isPaid
          ? 'bg-[#d1f2d9] border-[#28a745] text-[#28a745] hover:bg-[#bbf0c8]'
          : 'bg-[#f8d7da] border-[#dc3545] text-[#dc3545] hover:bg-[#f3c4c9]'
        }
      `}
    >
      <span className="text-xs font-bold">{member.id}</span>
      <span className="text-xs mt-1 truncate w-full text-center">
        {member.name.length > 10 ? member.name.slice(0, 10) + '...' : member.name}
      </span>
    </button>
  );
}
