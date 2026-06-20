import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
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
import { distributionDocId, paymentDocId } from "@/lib/financialIds";
import {
  dedupePaymentsByMember,
  getPaidMemberIds,
  normalizePaymentsCatalog,
  sumTotalPaid,
} from "@/lib/monthPayments";
import { getMonthAmount } from "@/lib/payment";
import {
  calculatePayment,
  resolveOutstandingBalance,
} from "@/lib/paymentMath";
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
  monthlyAmount: 2000,
  interestRate: 2,
  durationMonths: 36,
  totalMembers: 72,
  startMonth: 1,
  startYear: 2025,
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

function upsertPayments(
  existing: MonthlyPayment[],
  incoming: MonthlyPayment[],
): MonthlyPayment[] {
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const payment of incoming) {
    byId.set(payment.id, payment);
  }
  return Array.from(byId.values());
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
      const newPayments = upsertPayments(state.payments, [
        action.payload.payment,
      ]);
      const updatedMembers = state.members.map((m) =>
        m.id === action.payload.updatedMember.id
          ? action.payload.updatedMember
          : m,
      );
      return { ...state, payments: newPayments, members: updatedMembers };
    }

    case "ADD_DISTRIBUTION": {
      const exists = state.distributions.some(
        (d) => d.id === action.payload.id,
      );
      const newDistributions = exists
        ? state.distributions.map((d) =>
            d.id === action.payload.id ? action.payload : d,
          )
        : [...state.distributions, action.payload];
      return { ...state, distributions: newDistributions };
    }

    case "DELETE_DISTRIBUTION": {
      const newDistributions = state.distributions.filter(
        (d) => d.id !== action.payload,
      );
      return { ...state, distributions: newDistributions };
    }

    case "UPDATE_SETTINGS": {
      return { ...state, settings: action.payload };
    }

    case "MARK_ALL_PAID": {
      const updatedPayments = upsertPayments(state.payments, action.payload);
      return { ...state, payments: updatedPayments };
    }

    default:
      return state;
  }
}

export class ChitFundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChitFundError";
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  reloadFromFirestore: () => Promise<
    | { payments: MonthlyPayment[]; distributions: Distribution[]; members: Member[] }
    | undefined
  >;
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
  getMemberOutstandingBalance: (memberId: string) => number;
  getTotalCollectedForMonth: (month: number, year: number) => number;
  getPaidCountForMonth: (month: number, year: number) => number;
  getPendingCountForMonth: (month: number, year: number) => number;
  getCarryForwardBalance: (month: number, year: number) => number;
  getRemainingDistributionForMonth: (
    month: number,
    year: number,
  ) => number;
  hasMemberPaid: (memberId: string, month: number, year: number) => boolean;
  hasMemberDistribution: (
    memberId: string,
    month: number,
    year: number,
  ) => boolean;
  getContributionAmount: (month: number, year: number) => number;
  applyContributionToAllMembersForMonth: (
    month: number,
    year: number,
    contribution: number,
  ) => Promise<void>;
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

  const getMemberPayments = (memberId: string) => {
    return state.payments
      .filter((p) => p.memberId === memberId)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  };

  const getMemberOutstandingBalance = (memberId: string): number => {
    const member = state.members.find((m) => m.id === memberId);
    const payments = getMemberPayments(memberId);
    return resolveOutstandingBalance(member, payments);
  };

  const getMonthPayments = (month: number, year: number) => {
    const monthPayments = state.payments.filter(
      (p) => p.month === month && p.year === year,
    );
    return dedupePaymentsByMember(monthPayments);
  };

  const getTotalCollectedForMonth = (month: number, year: number) => {
    return sumTotalPaid(state.payments, month, year);
  };

  const getPaidCountForMonth = (month: number, year: number) => {
    return getPaidMemberIds(state.payments, month, year).size;
  };

  const getPendingCountForMonth = (month: number, year: number) => {
    return Math.max(0, state.members.length - getPaidCountForMonth(month, year));
  };

  const getTotalDistributedForMonth = (month: number, year: number) => {
    return state.distributions
      .filter((d) => d.month === month && d.year === year)
      .reduce((sum, d) => sum + d.amount, 0);
  };

  const getCarryForwardBalance = (month: number, year: number): number => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const prevMonthHasPayments = state.payments.some(
      (p) => p.month === prevMonth && p.year === prevYear,
    );
    if (!prevMonthHasPayments) return 0;

    const prevCollected = getTotalCollectedForMonth(prevMonth, prevYear);
    const prevDistributed = getTotalDistributedForMonth(prevMonth, prevYear);
    const prevCarry = getCarryForwardBalance(prevMonth, prevYear);

    return Math.max(0, prevCarry + prevCollected - prevDistributed);
  };

  const getRemainingDistributionForMonth = (month: number, year: number) => {
    return (
      getCarryForwardBalance(month, year)
      + getTotalCollectedForMonth(month, year)
      - getTotalDistributedForMonth(month, year)
    );
  };

  const hasMemberPaid = (memberId: string, month: number, year: number) => {
    return getPaidMemberIds(state.payments, month, year).has(memberId);
  };

  const hasMemberDistribution = (
    memberId: string,
    month: number,
    year: number,
  ) => {
    return state.distributions.some(
      (d) =>
        d.memberId === memberId && d.month === month && d.year === year,
    );
  };

  const getContributionAmount = (month: number, year: number) => {
    return getMonthAmount(month, year, state.settings);
  };

  const applyContributionToAllMembersForMonth = async (
    month: number,
    year: number,
    contribution: number,
  ) => {
    const user = auth.currentUser;
    if (!user) return;

    const safeContribution = Math.max(0, contribution);

    const paymentsById = new Map(
      state.payments.map((p) => [p.id, p]),
    );

    const buildUpdatedPayment = (memberId: string): MonthlyPayment => {
      const paymentId = paymentDocId(memberId, month, year);
      const existing = paymentsById.get(paymentId);

      const base: MonthlyPayment = existing
        ? existing
        : {
            id: paymentId,
            memberId,
            month,
            year,
            previousBalance: 0,
            contribution: safeContribution,
            principalPaid: 0,
            interest: 0,
            totalPaid: safeContribution,
            newBalance: 0,
            givenMoney: 0,
            paidAt: new Date().toISOString(),
          };

      return {
        ...base,
        contribution: safeContribution,
        totalPaid:
          safeContribution + (base.principalPaid ?? 0) + (base.interest ?? 0),
      };
    };

    const memberPayments: MonthlyPayment[] = [...state.members].map((m) =>
      buildUpdatedPayment(m.id),
    );

    for (let i = 0; i < memberPayments.length; i += 450) {
      const batch = writeBatch(db);
      for (const p of memberPayments.slice(i, i + 450)) {
        batch.set(
          doc(db, "users", user.uid, "payments", p.id),
          p,
          { merge: true },
        );
      }
      await batch.commit();
    }

    await reloadFromFirestore();
  };


  const reloadFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const preserveMonth = state.selectedMonth;
    const preserveYear = state.selectedYear;

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

    const memberIdSet = new Set(members.map((m) => m.id));

    const rawPayments: MonthlyPayment[] = paymentsSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<MonthlyPayment, "id">),
    }));

    const rawDistributions: Distribution[] = distributionsSnapshot.docs.map(
      (d) => ({
        id: d.id,
        ...(d.data() as Omit<Distribution, "id">),
      }),
    );

    // Orphan detection: exclude payments/distributions whose memberId is missing.
    const orphanPaymentDocs = rawPayments.filter(
      (p) => !memberIdSet.has(p.memberId),
    );
    const orphanDistributionDocs = rawDistributions.filter(
      (d) => !memberIdSet.has(d.memberId),
    );

    if (orphanPaymentDocs.length > 0 || orphanDistributionDocs.length > 0) {
      console.warn("Orphan records found during reloadFromFirestore:", {
        orphanPayments: orphanPaymentDocs.length,
        orphanDistributions: orphanDistributionDocs.length,
        orphanPaymentIds: orphanPaymentDocs.slice(0, 50).map((p) => p.id),
        orphanDistributionIds: orphanDistributionDocs
          .slice(0, 50)
          .map((d) => d.id),
      });
    }

    const paymentsWithoutOrphans = rawPayments.filter((p) =>
      memberIdSet.has(p.memberId),
    );
    const distributionsWithoutOrphans = rawDistributions.filter((d) =>
      memberIdSet.has(d.memberId),
    );

    // Optional automatic cleanup of orphan records in Firestore.
    // This runs best-effort; it will not block app load.
    const AUTO_CLEAN_ORPHANS = true;
    if (AUTO_CLEAN_ORPHANS) {
      try {
        const DELETE_BATCH_SIZE = 450;
        const orphanPaymentDocRefs = orphanPaymentDocs.map((p) =>
          doc(db, "users", userId, "payments", p.id),
        );
        const orphanDistributionDocRefs = orphanDistributionDocs.map((d) =>
          doc(db, "users", userId, "distributions", d.id),
        );

        const orphanRefs = [
          ...orphanPaymentDocRefs,
          ...orphanDistributionDocRefs,
        ];

        for (let i = 0; i < orphanRefs.length; i += DELETE_BATCH_SIZE) {
          const batch = writeBatch(db);
          for (const ref of orphanRefs.slice(i, i + DELETE_BATCH_SIZE)) {
            batch.delete(ref);
          }
          await batch.commit();
        }
      } catch (error) {
        console.error("Auto-clean orphan records failed:", error);
      }
    }

    const payments = normalizePaymentsCatalog(paymentsWithoutOrphans);
    const distributions = distributionsWithoutOrphans;

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
        selectedMonth: preserveMonth || settings.startMonth,
        selectedYear: preserveYear || settings.startYear,
      },
    });

    return { payments, distributions, members };
  };

  const repairRanRef = useRef(false);

  const repairStaleGivenMoney = async (
    payments: MonthlyPayment[],
    distributions: Distribution[],
    members: Member[],
  ) => {
    if (repairRanRef.current) return;
    const user = auth.currentUser;
    if (!user) return;

    const fixes: Array<{
      payment: MonthlyPayment;
      givenMoney: number;
      newBalance: number;
    }> = [];

    for (const dist of distributions) {
      const payment = payments.find(
        (p) =>
          p.memberId === dist.memberId &&
          p.month === dist.month &&
          p.year === dist.year,
      );
      if (!payment) continue;
      if ((payment.givenMoney ?? 0) !== 0) continue;

      fixes.push({
        payment,
        givenMoney: dist.amount,
        newBalance: payment.newBalance + dist.amount,
      });
    }

    if (fixes.length === 0) return;

    console.info(
      `[repairStaleGivenMoney] Fixing ${fixes.length} payment(s)`,
      fixes.map((f) => ({
        id: f.payment.id,
        givenMoney: f.givenMoney,
        newBalance: f.newBalance,
      })),
    );

    for (let i = 0; i < fixes.length; i += 450) {
      const batch = writeBatch(db);
      for (const fix of fixes.slice(i, i + 450)) {
        const updatedPayment: MonthlyPayment = {
          ...fix.payment,
          givenMoney: fix.givenMoney,
          newBalance: fix.newBalance,
        };
        batch.set(
          doc(db, "users", user.uid, "payments", updatedPayment.id),
          updatedPayment,
          { merge: true },
        );
      }
      await batch.commit();
    }

    for (const fix of fixes) {
      const member = members.find(
        (m) => m.id === fix.payment.memberId,
      );
      if (!member) continue;
      const updatedPayment: MonthlyPayment = {
        ...fix.payment,
        givenMoney: fix.givenMoney,
        newBalance: fix.newBalance,
      };
      dispatch({
        type: "RECORD_PAYMENT",
        payload: { payment: updatedPayment, updatedMember: member },
      });
    }

    repairRanRef.current = true;
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
        const data = await reloadFromFirestore();
        if (data) {
          await repairStaleGivenMoney(
            data.payments,
            data.distributions,
            data.members,
          );
        }
      } catch (error) {
        console.error("Firestore load error:", error);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const membersSnapshot = await getDocs(
      collection(db, "users", user.uid, "members"),
    );
    const existingMembers: Member[] = membersSnapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Member, "id">),
    }));

    let memberId = nextNumericMemberId(existingMembers);
    while (existingMembers.some((m) => m.id === memberId)) {
      memberId = String(Number(memberId) + 1);
    }

    const memberRef = doc(db, "users", user.uid, "members", memberId);
    const existingDoc = await getDoc(memberRef);
    if (existingDoc.exists()) {
      throw new ChitFundError(
        `Member ID ${memberId} already exists. Please try again.`,
      );
    }

    const newMember = {
      name: memberData.name,
      phone: memberData.phone,
      joinDate: new Date().toISOString(),
      balance: 0,
      active: true,
      notes: "",
    };

    await setDoc(memberRef, newMember, { merge: true });

    dispatch({
      type: "SET_STATE",
      payload: {
        members: [
          ...existingMembers,
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

    const userId = user.uid;

    try {
      // Data integrity: delete member + all related payments/distributions.
      // If any operation fails, we throw and avoid leaving partial state.

      // Fetch docs first so we can plan batch deletes.
      const [paymentsSnap, distributionsSnap] = await Promise.all([
        getDocs(collection(db, "users", userId, "payments")),
        getDocs(collection(db, "users", userId, "distributions")),
      ]);

      const paymentsToDelete = paymentsSnap.docs.filter(
        (d) => (d.data() as MonthlyPayment).memberId === id,
      );
      const distributionsToDelete = distributionsSnap.docs.filter(
        (d) => (d.data() as Distribution).memberId === id,
      );

      const DELETE_BATCH_SIZE = 450; // under Firestore batch limit (500)

      const deletions: Array<{ ref: any }> = [
        { ref: doc(db, "users", userId, "members", id) },
        ...paymentsToDelete.map((d) => ({ ref: d.ref })),
        ...distributionsToDelete.map((d) => ({ ref: d.ref })),
      ];

      for (let i = 0; i < deletions.length; i += DELETE_BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const item of deletions.slice(i, i + DELETE_BATCH_SIZE)) {
          batch.delete(item.ref);
        }
        await batch.commit();
      }

      // Reload as source-of-truth so totals across pages are recalculated.
      await reloadFromFirestore();
    } catch (error) {
      console.error("deleteMember failed:", { memberId: id, error });
      throw error;
    }
  };


  const recordPayment = async (
    memberId: string,
    month: number,
    year: number,
    principalPaid: number,
  ): Promise<MonthlyPayment | null> => {
    const member = state.members.find((m) => m.id === memberId);
    if (!member) return null;

    if (hasMemberPaid(memberId, month, year)) {
      throw new ChitFundError("Payment already recorded for this month.");
    }

    const memberPayments = getMemberPayments(memberId);
    const outstanding = resolveOutstandingBalance(member, memberPayments);
    const contribution = getContributionAmount(month, year);
    const calc = calculatePayment({
      outstanding,
      contribution,
      principalPaid,
      interestRate: state.settings.interestRate,
    });

    const payment: MonthlyPayment = {
      id: paymentDocId(memberId, month, year),
      memberId,
      month,
      year,
      ...calc,
      givenMoney: 0,
      paidAt: new Date().toISOString(),
    };

    const updatedMember: Member = {
      ...member,
      balance: calc.newBalance,
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

  const buildPaymentForMember = (
    member: Member,
    month: number,
    year: number,
  ): MonthlyPayment => {
    const memberPayments = getMemberPayments(member.id);
    const outstanding = resolveOutstandingBalance(member, memberPayments);
    const contribution = getContributionAmount(month, year);
    const calc = calculatePayment({
      outstanding,
      contribution,
      principalPaid: 0,
      interestRate: state.settings.interestRate,
    });

    return {
      id: paymentDocId(member.id, month, year),
      memberId: member.id,
      month,
      year,
      ...calc,
      givenMoney: 0,
      paidAt: new Date().toISOString(),
    };
  };

  const markAllPaidForMonth = async (month: number, year: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const alreadyPaid = getPaidMemberIds(state.payments, month, year);

    const payments: MonthlyPayment[] = [...state.members]
      .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
      .filter((m) => !alreadyPaid.has(m.id))
      .map((member) => buildPaymentForMember(member, month, year));

    for (let i = 0; i < payments.length; i += 450) {
      const batch = writeBatch(db);
      for (const p of payments.slice(i, i + 450)) {
        batch.set(doc(db, "users", user.uid, "payments", p.id), p, {
          merge: true,
        });
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
    const alreadyPaid = getPaidMemberIds(state.payments, month, year);

    const payments: MonthlyPayment[] = [...state.members]
      .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
      .filter(
        (member) => selectedIds.has(member.id) && !alreadyPaid.has(member.id),
      )
      .map((member) => buildPaymentForMember(member, month, year));

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

    if (amount <= 0) {
      throw new ChitFundError("Distribution amount must be greater than zero.");
    }

    if (hasMemberDistribution(memberId, month, year)) {
      throw new ChitFundError(
        "This member already received a loan for this month.",
      );
    }

    const remaining = getRemainingDistributionForMonth(month, year);
    if (amount > remaining) {
      throw new ChitFundError(
        `Cannot distribute ${amount}. Only ${Math.max(0, remaining)} remaining for this month.`,
      );
    }

    const member = state.members.find((m) => m.id === memberId);
    if (!member) return;

    const distribution: Distribution = {
      id: distributionDocId(memberId, month, year),
      memberId,
      month,
      year,
      amount,
      givenAt: new Date().toISOString(),
    };

    const updatedMember: Member = {
      ...member,
      balance: member.balance + amount,
    };

    const paymentId = paymentDocId(memberId, month, year);
    const existingPayment = state.payments.find((p) => p.id === paymentId);

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

    if (existingPayment) {
      const updatedPayment: MonthlyPayment = {
        ...existingPayment,
        givenMoney: (existingPayment.givenMoney ?? 0) + amount,
        newBalance: existingPayment.newBalance + amount,
      };
      batch.set(
        doc(db, "users", user.uid, "payments", paymentId),
        updatedPayment,
        { merge: true },
      );
      await batch.commit();

      dispatch({
        type: "RECORD_PAYMENT",
        payload: { payment: updatedPayment, updatedMember },
      });
    } else {
      await batch.commit();

      dispatch({ type: "UPDATE_MEMBER", payload: updatedMember });
    }

    dispatch({ type: "ADD_DISTRIBUTION", payload: distribution });
  };

  const deleteDistribution = async (distributionId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const distribution = state.distributions.find(
      (d) => d.id === distributionId,
    );
    if (!distribution) return;

    const member = state.members.find((m) => m.id === distribution.memberId);
    if (!member) return;

    const updatedMember: Member = {
      ...member,
      balance: Math.max(0, member.balance - distribution.amount),
    };

    const paymentId = paymentDocId(
      distribution.memberId,
      distribution.month,
      distribution.year,
    );
    const existingPayment = state.payments.find((p) => p.id === paymentId);

    const batch = writeBatch(db);
    batch.delete(doc(db, "users", user.uid, "distributions", distributionId));
    batch.set(
      doc(db, "users", user.uid, "members", updatedMember.id),
      updatedMember,
      { merge: true },
    );

    if (existingPayment) {
      const updatedPayment: MonthlyPayment = {
        ...existingPayment,
        givenMoney: Math.max(
          0,
          (existingPayment.givenMoney ?? 0) - distribution.amount,
        ),
        newBalance: Math.max(0, existingPayment.newBalance - distribution.amount),
      };
      batch.set(
        doc(db, "users", user.uid, "payments", paymentId),
        updatedPayment,
        { merge: true },
      );
      await batch.commit();

      dispatch({
        type: "RECORD_PAYMENT",
        payload: { payment: updatedPayment, updatedMember },
      });
    } else {
      await batch.commit();

      dispatch({ type: "UPDATE_MEMBER", payload: updatedMember });
    }

    dispatch({ type: "DELETE_DISTRIBUTION", payload: distributionId });
  };

  const updateSettings = async (settings: Settings) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid, "settings", "chit"), settings, {
      merge: true,
    });

    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  const getMemberBalance = (memberId: string) => {
    return getMemberOutstandingBalance(memberId);
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
        getMemberOutstandingBalance,
        getTotalCollectedForMonth,
        getPaidCountForMonth,
        getPendingCountForMonth,
        getCarryForwardBalance,
        getRemainingDistributionForMonth,
        hasMemberPaid,
        hasMemberDistribution,
        getContributionAmount,
        applyContributionToAllMembersForMonth,
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
