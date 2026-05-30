// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {

  apiKey:
    "AIzaSyBLwxeSh5WKqPlPVJhlb-xk-YJonVj48D0",

  authDomain:
    "homechit-f3b57.firebaseapp.com",

  projectId:
    "homechit-f3b57",

  storageBucket:
    "homechit-f3b57.firebasestorage.app",

  messagingSenderId:
    "548614997248",

  appId:
    "1:548614997248:web:4f071d5768152617745fe5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

setPersistence(
  auth,
  browserLocalPersistence
);

export const db = getFirestore(app);

export const googleProvider =
  new GoogleAuthProvider();
