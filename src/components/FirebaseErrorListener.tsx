
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a client component that will listen for permission errors
// and display a toast with the error message. In a real app this would
// be a more sophisticated error handling mechanism.
//
// This is not a user-facing component and should not be rendered in the UI.
// To use it, import it in your layout.tsx file and include it in the body.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, we'll throw the error to get the Next.js
      // error overlay with the stack trace and more details.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }

      // In production, we'll show a toast to the user.
      toast({
        title: 'Permission Denied',
        description:
          'You do not have permission to perform this action. Please contact support if you believe this is an error.',
        variant: 'destructive',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    // Clean up the listener when the component unmounts
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  // This component doesn't render anything itself
  return null;
}
