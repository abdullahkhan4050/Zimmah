
'use client';

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

// This function should be called on the client side.
// It will initialize Firebase if it hasn't been already.
function initializeFirebaseOnClient() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // Initialize Firebase on the client.
  // This will only happen once.
  useMemo(initializeFirebaseOnClient, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
