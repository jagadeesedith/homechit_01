import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Member, MonthlyPayment, Distribution, Settings } from '@/types';
import {
  getMembers, setMembers,
  getPayments, setPayments,
  getDistributions, setDistributions,
  getSettings, setSettings,
  seedInitialData,
} from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface State {
  members: Member[];
  payments: MonthlyPayment[];
  distributions: Distribution[];
  settings: Settings;
}

type Action =
  | { type: 'LOAD_DATA'; payload: State }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'RECORD_PAYMENT'; payload: { payment: MonthlyPayment; updatedMember: Member } }
  | { type: 'ADD_DISTRIBUTION'; payload: Distribution }
  | { type: 'UPDATE_SETTINGS'; payload: Settings };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;

    case 'ADD_MEMBER': {
      const updated = [...state.members, action.payload];
      setMembers(updated);
      return { ...state, members: updated };
    }

    case 'UPDATE_MEMBER': {
      const updated = state.members.map(m => m.id === action.payload.id ? action.payload : m);
      setMembers(updated);
      return { ...state, members: updated };
    }

    case 'DELETE_MEMBER': {
      const updated = state.members.filter(m => m.id !== action.payload);
      setMembers(updated);
      return { ...state, members: updated };
    }

    case 'RECORD_PAYMENT': {
      const newPayments = [...state.payments, action.payload.payment];
      const updatedMembers = state.members.map(m =>
        m.id === action.payload.updatedMember.id ? action.payload.updatedMember : m
      );
      setPayments(newPayments);
      setMembers(updatedMembers);
      return { ...state, payments: newPayments, members: updatedMembers };
    }

    case 'ADD_DISTRIBUTION': {
      const newDistributions = [...state.distributions, action.payload];
      setDistributions(newDistributions);
      return { ...state, distributions: newDistributions };
    }

    case 'UPDATE_SETTINGS': {
      setSettings(action.payload);
      return { ...state, settings: action.payload };
    }

    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  addMember: (member: Omit<Member, 'id' | 'joinDate' | 'balance'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;
  recordPayment: (memberId: string, month: number, year: number, principalPaid: number) => MonthlyPayment | null;
  addDistribution: (memberId: string, month: number, year: number, amount: number) => void;
  updateSettings: (settings: Settings) => void;
  getMemberPayments: (memberId: string) => MonthlyPayment[];
  getMonthPayments: (month: number, year: number) => MonthlyPayment[];
  getMemberBalance: (memberId: string) => number;
  getTotalCollectedForMonth: (month: number, year: number) => number;
  hasMemberPaid: (memberId: string, month: number, year: number) => boolean;
  getContributionAmount: (month: number, year: number) => number;
}

const ChitFundContext = createContext<ContextValue | null>(null);

const defaultSettings: Settings = {
  firstMonthAmount: 2000,
  monthlyAmount: 500,
  interestRate: 2,
  durationMonths: 36,
  totalMembers: 60,
};

export function ChitFundProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    members: [],
    payments: [],
    distributions: [],
    settings: defaultSettings,
  });

  useEffect(() => {
    seedInitialData();
    const members = getMembers();
    const payments = getPayments();
    const distributions = getDistributions();
    const settings = getSettings() || defaultSettings;
    dispatch({
      type: 'LOAD_DATA',
      payload: { members, payments, distributions, settings },
    });
  }, []);

  const addMember = (memberData: Omit<Member, 'id' | 'joinDate' | 'balance'>) => {
    const newMember: Member = {
      ...memberData,
      balance: 0,
      id: generateId(),
      joinDate: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_MEMBER', payload: newMember });
  };

  const updateMember = (member: Member) => {
    dispatch({ type: 'UPDATE_MEMBER', payload: member });
  };

  const deleteMember = (id: string) => {
    dispatch({ type: 'DELETE_MEMBER', payload: id });
  };

  const recordPayment = (
    memberId: string,
    month: number,
    year: number,
    principalPaid: number
  ): MonthlyPayment | null => {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return null;

    const isFirstMonth = month === 1 && year === new Date().getFullYear();
    const contribution = isFirstMonth ? state.settings.firstMonthAmount : state.settings.monthlyAmount;
    const interest = (member.balance * state.settings.interestRate) / 100;
    const totalPaid = contribution + principalPaid + interest;
    const newBalance = member.balance - principalPaid;

    const payment: MonthlyPayment = {
      id: generateId(),
      memberId,
      month,
      year,
      contribution,
      principalPaid,
      interest,
      totalPaid,
      newBalance,
      paidAt: new Date().toISOString(),
    };

    const updatedMember: Member = {
      ...member,
      balance: Math.max(0, newBalance),
    };

    dispatch({ type: 'RECORD_PAYMENT', payload: { payment, updatedMember } });
    return payment;
  };

  const addDistribution = (memberId: string, month: number, year: number, amount: number) => {
    const distribution: Distribution = {
      id: generateId(),
      memberId,
      month,
      year,
      amount,
      givenAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_DISTRIBUTION', payload: distribution });
  };

  const updateSettings = (settings: Settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const getMemberPayments = (memberId: string) => {
    return state.payments
      .filter(p => p.memberId === memberId)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  };

  const getMonthPayments = (month: number, year: number) => {
    return state.payments.filter(p => p.month === month && p.year === year);
  };

  const getMemberBalance = (memberId: string) => {
    const member = state.members.find(m => m.id === memberId);
    return member?.balance ?? 0;
  };

  const getTotalCollectedForMonth = (month: number, year: number) => {
    return state.payments
      .filter(p => p.month === month && p.year === year)
      .reduce((sum, p) => sum + p.totalPaid, 0);
  };

  const hasMemberPaid = (memberId: string, month: number, year: number) => {
    return state.payments.some(p => p.memberId === memberId && p.month === month && p.year === year);
  };

  const getContributionAmount = (month: number, year: number) => {
    const isFirstMonth = month === 1 && year === new Date().getFullYear();
    return isFirstMonth ? state.settings.firstMonthAmount : state.settings.monthlyAmount;
  };

  return (
    <ChitFundContext.Provider
      value={{
        state,
        addMember,
        updateMember,
        deleteMember,
        recordPayment,
        addDistribution,
        updateSettings,
        getMemberPayments,
        getMonthPayments,
        getMemberBalance,
        getTotalCollectedForMonth,
        hasMemberPaid,
        getContributionAmount,
      }}
    >
      {children}
    </ChitFundContext.Provider>
  );
}

export function useChitFund(): ContextValue {
  const ctx = useContext(ChitFundContext);
  if (!ctx) throw new Error('useChitFund must be used within ChitFundProvider');
  return ctx;
}
