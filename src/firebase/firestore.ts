import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';

import { db } from './firebase';

export type FirestoreDoc<T> = T & { id: string };

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  profilePhoto: string | null;
  createdAt: DocumentData | null;
}


export const USERS_COLLECTION = 'users';
export const MEMBERS_COLLECTION = 'members';
export const PAYMENTS_COLLECTION = 'payments';
export const DISTRIBUTIONS_COLLECTION = 'distributions';
export const SETTINGS_COLLECTION = 'settings';

export function userDoc(uid: string) {
  return doc(db, USERS_COLLECTION, uid);
}

export function migrateSourceAvailable() {
  // placeholder for future migration orchestration
  return true;
}

export async function upsertUserProfile(uid: string, profile: Omit<UserProfile, 'createdAt'>) {
  await setDoc(userDoc(uid), {
    ...profile,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export function listenCollectionByOwner<T>(args: {
  ownerId: string;
  collectionName: string;
  map: (snap: unknown) => T;
  onData: (items: FirestoreDoc<T>[]) => void;
  onError: (err: unknown) => void;
}): Unsubscribe {

  const q = query(
    collection(db, args.collectionName),
    where('ownerId', '==', args.ownerId),
    limit(1000)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      }) as FirestoreDoc<T>);
      args.onData(items);
    },
    (err) => args.onError(err)
  );
}

export async function fetchCollectionByOwner<T>(args: {
  ownerId: string;
  collectionName: string;
}): Promise<FirestoreDoc<T>[]> {
  const q = query(
    collection(db, args.collectionName),
    where('ownerId', '==', args.ownerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as DocumentData),
  }) as FirestoreDoc<T>);
}

export async function replaceSettings(args: {
  ownerId: string;
  settings: Record<string, unknown>;
}) {
  // Use a deterministic doc id per owner so each user has 1 settings doc
  const ref = doc(db, SETTINGS_COLLECTION, args.ownerId);
  await setDoc(ref, {
    ownerId: args.ownerId,
    ...args.settings,
  }, { merge: true });
}

export function listenSettings(args: {
  ownerId: string;
  onData: (settings: Record<string, unknown> | null) => void;
  onError: (err: unknown) => void;
}): Unsubscribe {
  const ref = doc(db, SETTINGS_COLLECTION, args.ownerId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      args.onData(null);
      return;
    }
    const data = snap.data() as DocumentData;
    args.onData({ id: snap.id, ...data });
  }, (err) => args.onError(err));
}

export async function batchUpsertMany(args: {
  operations: Array<{
    refPath: string;
    docId: string;
    data: any;
  }>;
}) {
  const batch = writeBatch(db);
  for (const op of args.operations) {
    const ref = doc(db, op.refPath, op.docId);
    batch.set(ref, op.data, { merge: true });
  }
  await batch.commit();
}

export async function batchDeleteMany(args: {
  collectionName: string;
  docIds: string[];
}) {
  const batch = writeBatch(db);
  for (const id of args.docIds) {
    batch.delete(doc(db, args.collectionName, id));
  }
  await batch.commit();
}

export { db };

