import {
  doc,
  setDoc
} from 'firebase/firestore';

import {
  db,
  auth
} from './lib/firebase';

export async function setupFirestore() {

  const user =
    auth.currentUser;

  if (!user) {

    alert(
      'Login first'
    );

    return;
  }

  const userRef = doc(
    db,
    'users',
    user.uid
  );

  /* USER */

  await setDoc(userRef, {

    name:
      user.displayName ||

      'User',

    email:
      user.email,

    createdAt:
      new Date()
        .toISOString(),

    plan: 'free',
  });

  /* SETTINGS */

  const settingsRef = doc(
    db,
    'users',
    user.uid,
    'settings',
    'chit'
  );

  await setDoc(settingsRef, {

    firstMonthAmount: 2000,

    monthlyAmount: 500,

    interestRate: 2,

    durationMonths: 36,

    totalMembers: 60,

    startMonth: 4,

    startYear: 2026,
  });

  /* SAMPLE MEMBER */

  await setDoc(
    doc(db, 'users', user.uid, 'members', '1'),
    {
      name: 'Sample Member',
      phone: '9876543210',
      joinDate: new Date().toLocaleDateString(),
      balance: 0,
      active: true,
      notes: '',
    },
    { merge: true }
  );

  alert(
    'Firestore setup complete'
  );
}