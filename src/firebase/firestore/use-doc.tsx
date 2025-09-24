
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  onSnapshot,
  doc,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// A hook to read a document from Firestore.
// This hook will automatically update when the data changes.
//
// Example:
// const { data, loading, error } = useDoc<MyType>('my-collection/my-doc');
// const { data, loading, error } = useDoc<MyType>(doc(firestore, 'my-collection', 'my-doc'));
export function useDoc<T extends DocumentData>(
  docOrPath: string | DocumentReference<T> | null,
  options?: {
    onSuccess?: (data: T | null) => void;
    onError?: (error: Error) => void;
  }
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedDocRef = useMemo(() => {
    if (!docOrPath) return null;
    if (typeof docOrPath === 'string') {
      if (!firestore) return null;
      return doc(firestore, docOrPath) as DocumentReference<T>;
    }
    return docOrPath;
  }, [firestore, docOrPath]);

  useEffect(() => {
    if (!memoizedDocRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as T;
          setData(data);
          options?.onSuccess?.(data);
        } else {
          setData(null);
          options?.onSuccess?.(null);
        }
        setLoading(false);
      },
      (err) => {
        // Emit a permission error if the user is not allowed to read the document.
        // This will be caught by the FirebaseErrorListener and displayed in the UI.
        const permissionError = new FirestorePermissionError({
          path: memoizedDocRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);

        setError(permissionError);
        setLoading(false);
        options?.onError?.(permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, options]);

  return { data, loading, error };
}
