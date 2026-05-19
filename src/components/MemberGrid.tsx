import { useChitFund } from '../context/ChitFundContext';
import { MemberBox } from './MemberBox';
import type { Member } from '@/types';

interface MemberGridProps {
  month: number;
  year: number;
  members?: Member[];
  selectMode?: boolean;
  selectedMemberIds?: Set<string>;
  onOpenMember?: (memberId: string) => void;
  onToggleMember?: (memberId: string) => void;
}

export function MemberGrid({
  month,
  year,
  members,
  selectMode = false,
  selectedMemberIds = new Set<string>(),
  onOpenMember,
  onToggleMember,
}: MemberGridProps) {
  const { state } = useChitFund();
  const visibleMembers = members ?? state.members;

  return (
    <div>
      {visibleMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
          No members found
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10 gap-3">
          {[...visibleMembers]
            .sort((a, b) => parseInt(a.id) - parseInt(b.id))
            .map((member) => (
              <MemberBox
                key={member.id}
                memberId={member.id}
                month={month}
                year={year}
                onClick={() => onOpenMember?.(member.id)}
                selectMode={selectMode}
                selected={selectedMemberIds.has(member.id)}
                onToggle={() => onToggleMember?.(member.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
