
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  type DocumentData,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// A hook to read a collection from Firestore.
// This hook will automatically update when the data changes.
//
// Example:
// const { data, loading, error } = useCollection<MyType>('my-collection');
// const { data, loading, error } = useCollection<MyType>(collection(firestore, 'my-collection'));
// const { data, loading, error } = useCollection<MyType>(query(collection(firestore, 'my-collection'), where('foo', '==', 'bar')));
export function useCollection<T extends DocumentData>(
  collectionOrQuery: string | CollectionReference<T> | Query<T> | null,
  options?: {
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
  }
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize the query to prevent re-renders
  const memoizedQuery = useMemo(() => {
    if (!collectionOrQuery) {
      return null;
    }
    if (typeof collectionOrQuery === 'string') {
      if (!firestore) return null;
      return collection(firestore, collectionOrQuery) as CollectionReference<T>;
    }
    return collectionOrQuery;
  }, [firestore, collectionOrQuery]);

  useEffect(() => {
    if (!memoizedQuery) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(data);
        setLoading(false);
        options?.onSuccess?.(data);
      },
      (err) => {
        // Emit a permission error if the user is not allowed to read the collection.
        // This will be caught by the FirebaseErrorListener and displayed in the UI.
        const permissionError = new FirestorePermissionError({
          path:
            memoizedQuery instanceof CollectionReference
              ? memoizedQuery.path
              : 'complex query', // It's hard to get the path from a general query
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);

        setError(permissionError);
        setLoading(false);
        options?.onError?.(permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, options]);

  return { data, loading, error };
}
