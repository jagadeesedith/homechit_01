/** Deterministic Firestore document IDs — same member/month/year always maps to one doc. */
export function paymentDocId(
  memberId: string,
  month: number,
  year: number,
): string {
  return `${year}-${String(month).padStart(2, "0")}-${memberId}`;
}

export function distributionDocId(
  memberId: string,
  month: number,
  year: number,
): string {
  return `dist-${year}-${String(month).padStart(2, "0")}-${memberId}`;
}

/** Legacy import IDs without zero-padded month (e.g. 2026-4-1). */
export function legacyPaymentDocIds(
  memberId: string,
  month: number,
  year: number,
): string[] {
  return [
    paymentDocId(memberId, month, year),
    `${year}-${month}-${memberId}`,
  ];
}
