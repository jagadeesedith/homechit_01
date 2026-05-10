import { useChitFund } from '../context/ChitFundContext';

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
        group relative p-4 rounded-2xl border flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 ease-in-out min-h-[90px] w-full
        shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]
        ${isPaid
          ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-green-200 text-emerald-700 hover:from-emerald-100 hover:to-green-200 hover:border-green-300'
          : 'bg-gradient-to-br from-rose-50 to-red-100 border-red-200 text-red-700 hover:from-rose-100 hover:to-red-200 hover:border-red-300'
        }
        focus:outline-none focus:ring-4 focus:ring-blue-100 focus:ring-offset-2
        overflow-hidden
      `}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <span className="text-xs font-black tracking-wide">{member.id}</span>
        <span className="text-xs mt-1.5 truncate w-full text-center font-medium leading-tight">
          {member.name.length > 12 ? member.name.slice(0, 12) + '...' : member.name}
        </span>
        
        {/* Status indicator */}
        <div className={`mt-2 px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-300 ${
          isPaid 
            ? 'bg-emerald-500 text-white shadow-md' 
            : 'bg-red-500 text-white shadow-md'
        }`}>
          {isPaid ? '✓' : '○'}
        </div>
      </div>
    </button>
  );
}
