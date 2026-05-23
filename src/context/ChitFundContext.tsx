import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import type { Distribution, Member, MonthlyPayment, Settings } from "@/types";
import { generateId } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";

interface State {
  members: Member[];
  payments: MonthlyPayment[];
  distributions: Distribution[];
  settings: Settings;
  selectedMonth: number;
  selectedYear: number;
}

type Action =
  | { type: "LOAD_DATA"; payload: State }
  | { type: "SET_STATE"; payload: Partial<State> }
  | { type: "SET_SELECTED_MONTH_YEAR"; payload: { month: number; year: number } }
  | { type: "UPDATE_MEMBER"; payload: Member }
  | { type: "DELETE_MEMBER"; payload: string }
  | {
      type: "RECORD_PAYMENT";
      payload: { payment: MonthlyPayment; updatedMember: Member };
    }
  | { type: "ADD_DISTRIBUTION"; payload: Distribution }
  | { type: "DELETE_DISTRIBUTION"; payload: string }
  | { type: "MARK_ALL_PAID"; payload: MonthlyPayment[] }
  | { type: "UPDATE_SETTINGS"; payload: Settings };

const defaultSettings: Settings = {
  firstMonthAmount: 2000,
  monthlyAmount: 500,
  interestRate: 2,
  durationMonths: 36,
  totalMembers: 60,
  startMonth: 4,
  startYear: 2026,
};

function nextNumericMemberId(existing: Member[]): string {
  let maxId = 0;
  for (const m of existing) {
    const digits = String(m.id).match(/\d+/g)?.join("") ?? "";
    const n = Number(digits);
    if (Number.isFinite(n)) maxId = Math.max(maxId, n);
  }
  return String(maxId + 1);
}

function paymentDocId(memberId: string, month: number, year: number): string {
  // deterministic id prevents duplicates across refresh/import
  return `${year}-${String(month).padStart(2, "0")}-${memberId}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_DATA":
      return action.payload;

    case "SET_STATE":
      return {
        ...state,
        ...action.payload,
      };

    case "SET_SELECTED_MONTH_YEAR":
      return {
        ...state,
        selectedMonth: action.payload.month,
        selectedYear: action.payload.year,
      };

    case "UPDATE_MEMBER": {
      const updated = state.members.map((m) =>
        m.id === action.payload.id ? action.payload : m,
      );
      return { ...state, members: updated };
    }

    case "DELETE_MEMBER": {
      const updated = state.members.filter((m) => m.id !== action.payload);
      return { ...state, members: updated };
    }

    case "RECORD_PAYMENT": {
      const newPayments = [...state.payments, action.payload.payment];
      const updatedMembers = state.members.map((m) =>
        m.id === action.payload.updatedMember.id
          ? action.payload.updatedMember
          : m,
      );
      return { ...state, payments: newPayments, members: updatedMembers };
    }

    case "ADD_DISTRIBUTION": {
      const newDistributions = [...state.distributions, action.payload];
      return { ...state, distributions: newDistributions };
    }

    case "DELETE_DISTRIBUTION": {
      const newDistributions = state.distributions.filter(
        (d) => d.id !== action.payload
      );
      return { ...state, distributions: newDistributions };
    }

    case "UPDATE_SETTINGS": {
      return { ...state, settings: action.payload };
    }

    case "MARK_ALL_PAID": {
      const updatedPayments = [...state.payments, ...action.payload];
      return { ...state, payments: updatedPayments };
    }

    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  reloadFromFirestore: () => Promise<void>;
  setSelectedMonthYear: (month: number, year: number) => void;
  addMember: (
    member: Omit<Member, "id" | "joinDate" | "balance">,
  ) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  recordPayment: (
    memberId: string,
    month: number,
    year: number,
    principalPaid: number,
  ) => Promise<MonthlyPayment | null>;
  markAllPaidForMonth: (month: number, year: number) => Promise<void>;
  markMembersPaidForMonth: (
    memberIds: string[],
    month: number,
    year: number,
  ) => Promise<number>;
  addDistribution: (
    memberId: string,
    month: number,
    year: number,
    amount: number,
  ) => Promise<void>;
  deleteDistribution: (distributionId: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;

  getMemberPayments: (memberId: string) => MonthlyPayment[];
  getMonthPayments: (month: number, year: number) => MonthlyPayment[];
  getMemberBalance: (memberId: string) => number;
  getTotalCollectedForMonth: (month: number, year: number) => number;
  hasMemberPaid: (memberId: string, month: number, year: number) => boolean;
  getContributionAmount: (month: number, year: number) => number;
}

const ChitFundContext = createContext<ContextValue | null>(null);

export function ChitFundProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    members: [],
    payments: [],
    distributions: [],
    settings: defaultSettings,
    selectedMonth: defaultSettings.startMonth,
    selectedYear: defaultSettings.startYear,
  });

  const reloadFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;

    const [
      membersSnapshot,
      paymentsSnapshot,
      distributionsSnapshot,
      settingsSnap,
    ] = await Promise.all([
      getDocs(collection(db, "users", userId, "members")),
      getDocs(collection(db, "users", userId, "payments")),
      getDocs(collection(db, "users", userId, "distributions")),
      getDoc(doc(db, "users", userId, "settings", "chit")),
    ]);

    const members: Member[] = membersSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Member, "id">),
    }));

    const payments: MonthlyPayment[] = paymentsSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MonthlyPayment, "id">),
    }));

    const distributions: Distribution[] = distributionsSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Distribution, "id">),
    }));

    const settings: Settings = settingsSnap.exists()
      ? ({ ...(settingsSnap.data() as Settings) } satisfies Settings)
      : defaultSettings;

    dispatch({
      type: "LOAD_DATA",
      payload: {
        members,
        payments,
        distributions,
        settings,
        selectedMonth: settings.startMonth,
        selectedYear: settings.startYear,
      },
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        dispatch({
          type: "LOAD_DATA",
          payload: {
            members: [],
            payments: [],
            distributions: [],
            settings: defaultSettings,
            selectedMonth: defaultSettings.startMonth,
            selectedYear: defaultSettings.startYear,
          },
        });
        return;
      }

      try {
        await reloadFromFirestore();
      } catch (error) {
        console.error("Firestore load error:", error);
      }
    });

    return () => unsubscribe();
     }, []);

  const setSelectedMonthYear = (month: number, year: number) => {
    dispatch({ type: "SET_SELECTED_MONTH_YEAR", payload: { month, year } });
  };

  const addMember = async (memberData: {
    name: string;
    phone: string;
  }) => {
    const user = auth.currentUser;
    if (!user) return;

    const newMember = {
      name: memberData.name,
      phone: memberData.phone,
      joinDate: new Date().toISOString(),
      balance: 0,
      active: true,
      notes: "",
    };

    const memberId = nextNumericMemberId(state.members);

    await setDoc(
      doc(db, "users", user.uid, "members", memberId),
      newMember,
      { merge: true },
    );

    dispatch({
      type: "SET_STATE",
      payload: {
        members: [
          ...state.members,
          {
            id: memberId,
            ...(newMember as Omit<Member, "id">),
          },
        ],
      },
    });
  };

  const updateMember = async (member: Member) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid, "members", member.id), member, {
      merge: true,
    });

    dispatch({ type: "UPDATE_MEMBER", payload: member });
  };

  const deleteMember = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, "users", user.uid, "members", id));
    await batch.commit();

    dispatch({ type: "DELETE_MEMBER", payload: id });
  };

  const recordPayment = async (
    memberId: string,
    month: number,
    year: number,
    principalPaid: number,
  ): Promise<MonthlyPayment | null> => {
    const member = state.members.find((m) => m.id === memberId);
    if (!member) return null;

    const isFirstMonth =
      month === state.settings.startMonth &&
      year === state.settings.startYear;

    const amount = isFirstMonth
      ? state.settings.firstMonthAmount
      : state.settings.monthlyAmount;

    const interest = (member.balance * state.settings.interestRate) / 100;
    const totalPaid = amount + principalPaid + interest;
    const newBalance = member.balance - principalPaid;

    const payment: MonthlyPayment = {
      id: paymentDocId(memberId, month, year),
      memberId,
      month,
      year,
      previousBalance: member.balance,
      contribution: amount,
      principalPaid,
      interest,
      totalPaid,
      newBalance,
      givenMoney: 0,
      paidAt: new Date().toISOString(),
    };

    const updatedMember: Member = {
      ...member,
      balance: Math.max(0, newBalance),
    };

    const user = auth.currentUser;
    if (!user) return null;

    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid, "payments", payment.id), payment, {
      merge: true,
    });
    batch.set(
      doc(db, "users", user.uid, "members", updatedMember.id),
      updatedMember,
      { merge: true },
    );

    await batch.commit();

    dispatch({
      type: "RECORD_PAYMENT",
      payload: { payment, updatedMember },
    });

    return payment;
  };

  const markAllPaidForMonth = async (month: number, year: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const alreadyPaid = new Set(
      state.payments
        .filter((p) => p.month === month && p.year === year)
        .map((p) => p.memberId),
    );

    const payments: MonthlyPayment[] = [...state.members]
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .filter((m) => !alreadyPaid.has(m.id))
      .map((member) => {
      const isFirstMonth =
        month === state.settings.startMonth &&
        year === state.settings.startYear;

      const contribution = isFirstMonth
        ? state.settings.firstMonthAmount
        : state.settings.monthlyAmount;

      const interest = (member.balance * state.settings.interestRate) / 100;
      const principalPaid = 0;
      const totalPaid = contribution + principalPaid + interest;

      return {
        id: paymentDocId(member.id, month, year),
        memberId: member.id,
        month,
        year,
        previousBalance: member.balance,
        contribution,
        principalPaid,
        interest,
        totalPaid,
        newBalance: member.balance,
        givenMoney: 0,
        paidAt: new Date().toISOString(),
      };
    });

    for (let i = 0; i < payments.length; i += 450) {
      const batch = writeBatch(db);
      for (const p of payments.slice(i, i + 450)) {
        batch.set(doc(db, "users", user.uid, "payments", p.id), p, { merge: true });
      }
      await batch.commit();
    }

    if (payments.length > 0) {
      dispatch({ type: "MARK_ALL_PAID", payload: payments });
    }
  };

  const markMembersPaidForMonth = async (
    memberIds: string[],
    month: number,
    year: number,
  ): Promise<number> => {
    const user = auth.currentUser;
    if (!user || memberIds.length === 0) return 0;

    const selectedIds = new Set(memberIds);
    const alreadyPaid = new Set(
      state.payments
        .filter((p) => p.month === month && p.year === year)
        .map((p) => p.memberId),
    );

    const payments: MonthlyPayment[] = [...state.members]
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .filter((member) => selectedIds.has(member.id) && !alreadyPaid.has(member.id))
      .map((member) => {
        const isFirstMonth =
          month === state.settings.startMonth &&
          year === state.settings.startYear;

        const contribution = isFirstMonth
          ? state.settings.firstMonthAmount
          : state.settings.monthlyAmount;

        const principalPaid = 0;
        const interest = (member.balance * state.settings.interestRate) / 100;
        const totalPaid = contribution + principalPaid + interest;

        return {
          id: paymentDocId(member.id, month, year),
          memberId: member.id,
          month,
          year,
          previousBalance: member.balance,
          contribution,
          principalPaid,
          interest,
          totalPaid,
          newBalance: member.balance,
          givenMoney: 0,
          paidAt: new Date().toISOString(),
        };
      });

    for (let i = 0; i < payments.length; i += 450) {
      const batch = writeBatch(db);
      for (const payment of payments.slice(i, i + 450)) {
        batch.set(doc(db, "users", user.uid, "payments", payment.id), payment, {
          merge: true,
        });
      }
      await batch.commit();
    }

    if (payments.length > 0) {
      dispatch({ type: "MARK_ALL_PAID", payload: payments });
    }

    return payments.length;
  };

  const addDistribution = async (
    memberId: string,
    month: number,
    year: number,
    amount: number,
  ): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    const distribution: Distribution = {
      id: generateId(),
      memberId,
      month,
      year,
      amount,
      givenAt: new Date().toISOString(),
    };

    const member = state.members.find((m) => m.id === memberId);
    if (!member) return;

    const updatedMember: Member = {
      ...member,
      balance: member.balance + amount,
    };

    const batch = writeBatch(db);
    batch.set(
      doc(db, "users", user.uid, "distributions", distribution.id),
      distribution,
      { merge: true },
    );
    batch.set(
      doc(db, "users", user.uid, "members", updatedMember.id),
      updatedMember,
      { merge: true },
    );
    await batch.commit();

    dispatch({ type: "UPDATE_MEMBER", payload: updatedMember });
    dispatch({ type: "ADD_DISTRIBUTION", payload: distribution });
  };

  const deleteDistribution = async (distributionId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const distribution = state.distributions.find(d => d.id === distributionId);
    if (!distribution) return;

    const member = state.members.find((m) => m.id === distribution.memberId);
    if (!member) return;

    // Update member balance (subtract the distributed amount)
    const updatedMember: Member = {
      ...member,
      balance: Math.max(0, member.balance - distribution.amount),
    };

    const batch = writeBatch(db);
    // Delete the distribution document
    batch.delete(doc(db, "users", user.uid, "distributions", distributionId));
    // Update the member document
    batch.set(
      doc(db, "users", user.uid, "members", updatedMember.id),
      updatedMember,
      { merge: true },
    );
    await batch.commit();

    dispatch({ type: "UPDATE_MEMBER", payload: updatedMember });
    dispatch({ type: "DELETE_DISTRIBUTION", payload: distributionId });
  };

  const updateSettings = async (settings: Settings) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid, "settings", "chit"),
      settings,
      { merge: true },
    );

    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  const getMemberPayments = (memberId: string) => {
    return state.payments
      .filter((p) => p.memberId === memberId)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  };

  const getMonthPayments = (month: number, year: number) => {
    return state.payments.filter((p) => p.month === month && p.year === year);
  };

  const getMemberBalance = (memberId: string) => {
    const member = state.members.find((m) => m.id === memberId);
    return member?.balance ?? 0;
  };

  const getTotalCollectedForMonth = (month: number, year: number) => {
    const totalCollected = state.payments
      .filter((p) => p.month === month && p.year === year)
      .reduce((sum, p) => sum + (p.totalPaid || 0), 0);

    return totalCollected;
  };

  const hasMemberPaid = (memberId: string, month: number, year: number) => {
    return state.payments.some(
      (p) => p.memberId === memberId && p.month === month && p.year === year,
    );
  };

  const getContributionAmount = (month: number, year: number) => {
    const isFirstMonth =
      month === state.settings.startMonth && year === state.settings.startYear;

    return isFirstMonth ? state.settings.firstMonthAmount : state.settings.monthlyAmount;
  };

  return (
    <ChitFundContext.Provider
      value={{
        state,
        dispatch,
        reloadFromFirestore,
        setSelectedMonthYear,
        addMember,
        updateMember,
        deleteMember,
        recordPayment,
        markAllPaidForMonth,
        markMembersPaidForMonth,
        addDistribution,
        deleteDistribution,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useChitFund(): ContextValue {
  const ctx = useContext(ChitFundContext);
  if (!ctx) throw new Error("useChitFund must be used within ChitFundProvider");
  return ctx;
}

