import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import {
  db,
  auth
} from './firebase';

import type { Member } from '@/types';

/* ADD MEMBER */
export async function addMemberToFirestore(
  member: Member
) {

  const user =
    auth.currentUser;

  if (!user)
    throw new Error(
      'User not logged in'
    );

  await addDoc(
    collection(db, 'members'),

    {
      ...member,

      userId: user.uid,
    }
  );
}

/* GET MEMBERS */
export async function getMembersFromFirestore() {

  const user =
    auth.currentUser;

  if (!user) return [];

  const q = query(
    collection(db, 'members'),

    where(
      'userId',
      '==',
      user.uid
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(
  (doc) => ({

    id: doc.id,

    ...doc.data(),
  })
) as Member[];
}