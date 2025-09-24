
'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { ReactNode, createContext, useContext } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Create a context for the Firebase app, auth, and firestore.
const FirebaseAppContext = createContext<FirebaseApp | null>(null);
const AuthContext = createContext<Auth | null>(null);
const FirestoreContext = createContext<Firestore | null>(null);

// Create a provider component that will wrap the entire app.
// This will make the Firebase app, auth, and firestore available to all components.
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}) {
  return (
    <FirebaseAppContext.Provider value={firebaseApp}>
      <AuthContext.Provider value={auth}>
        <FirestoreContext.Provider value={firestore}>
            <FirebaseErrorListener />
            {children}
        </FirestoreContext.Provider>
      </AuthContext.Provider>
    </FirebaseAppContext.Provider>
  );
}

// Create hooks to access the Firebase app, auth, and firestore.
export const useFirebaseApp = () => useContext(FirebaseAppContext);
export const useAuth = () => useContext(AuthContext);
export const useFirestore = () => useContext(FirestoreContext);
