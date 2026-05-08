import { useState } from 'react';
import { useChitFund } from '../context/ChitFundContext';
import { MemberBox } from './MemberBox';
import { PaymentModal } from './PaymentModal';

interface MemberGridProps {
  month: number;
  year: number;
}

export function MemberGrid({ month, year }: MemberGridProps) {
  const { state } = useChitFund();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  return (
    <>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-10 gap-3">
        {state.members.map((member) => (
          <MemberBox
            key={member.id}
            memberId={member.id}
            month={month}
            year={year}
            onClick={() => setSelectedMember(member.id)}
          />
        ))}
      </div>

      {selectedMember && (
        <PaymentModal
          memberId={selectedMember}
          month={month}
          year={year}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  );
}
