import {
  doc,
  setDoc,
  collection,
  addDoc
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

  /* PROJECT */

  const projectRef = doc(
    db,
    'users',
    user.uid,
    'projects',
    'default-project'
  );

  await setDoc(projectRef, {

    projectName:
      'Main Chit',

    totalMembers: 60,

    monthlyAmount: 2000,

    startMonth: 1,

    startYear: 2026,

    active: true,

    createdAt:
      new Date()
        .toISOString(),
  });

  /* SETTINGS */

  const settingsRef = doc(
    db,
    'users',
    user.uid,
    'projects',
    'default-project',
    'settings',
    'config'
  );

  await setDoc(settingsRef, {

    firstMonthAmount: 2000,

    monthlyAmount: 500,

    totalMembers: 60,

    currency: 'INR',

    theme: 'dark',
  });

  /* SAMPLE MEMBER */

  await addDoc(

    collection(
      db,
      'users',
      user.uid,
      'projects',
      'default-project',
      'members'
    ),

    {
      name: 'Sample Member',

      phone: '9876543210',

      balance: 0,

      totalPaid: 0,

      joinDate:
        new Date()
          .toISOString(),

      active: true,
    }
  );

  alert(
    'Firestore setup complete'
  );
}