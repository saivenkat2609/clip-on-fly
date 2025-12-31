/**
 * HIGH PRIORITY FIX #23: Re-authentication Hook
 *
 * Provides a clean API for requesting user re-authentication
 * before sensitive actions.
 *
 * Usage:
 *   const { requestReauth } = useReauth();
 *
 *   async function handleDeleteAccount() {
 *     const confirmed = await requestReauth('delete your account');
 *     if (confirmed) {
 *       // Proceed with deletion
 *     }
 *   }
 */

import { useState, createContext, useContext, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import {
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from 'firebase/auth';
import { googleProvider } from '@/lib/firebase';
import { ReauthModal } from '@/components/ReauthModal';

interface ReauthContextType {
  requestReauth: (action: string) => Promise<boolean>;
}

const ReauthContext = createContext<ReauthContextType | null>(null);

interface ReauthProviderProps {
  children: ReactNode;
}

export function ReauthProvider({ children }: ReauthProviderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState('');
  const [providerType, setProviderType] = useState<'password' | 'google'>('password');
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  /**
   * Request re-authentication from user
   * Returns a Promise that resolves to true if successful, false if cancelled
   */
  const requestReauth = async (actionDescription: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) {
      console.error('[Reauth] No current user');
      return false;
    }

    // Determine provider type
    const providerId = user.providerData[0]?.providerId;

    if (providerId === 'password') {
      setProviderType('password');
    } else if (providerId === 'google.com') {
      setProviderType('google');
    } else {
      console.error('[Reauth] Unsupported provider:', providerId);
      return false;
    }

    // Set action description
    setAction(actionDescription);

    // Open modal and return a promise
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
      setModalOpen(true);
    });
  };

  /**
   * Handle password re-authentication
   */
  const handleReauth = async (password: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      if (providerType === 'password') {
        // Password re-authentication
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        console.log('[Reauth] Password re-authentication successful');
        return true;
      } else if (providerType === 'google') {
        // Google re-authentication
        await reauthenticateWithPopup(user, googleProvider);
        console.log('[Reauth] Google re-authentication successful');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[Reauth] Re-authentication failed:', error);
      throw error; // Propagate error to modal for proper error handling
    }
  };

  /**
   * Handle modal close (either success or cancel)
   */
  const handleClose = (success: boolean = false) => {
    setModalOpen(false);
    if (resolvePromise) {
      resolvePromise(success);
      setResolvePromise(null);
    }
  };

  return (
    <ReauthContext.Provider value={{ requestReauth }}>
      {children}
      <ReauthModal
        open={modalOpen}
        onClose={() => handleClose(false)}
        onReauth={async (password) => {
          const success = await handleReauth(password);
          if (success) {
            handleClose(true);
          }
          return success;
        }}
        action={action}
        providerType={providerType}
      />
    </ReauthContext.Provider>
  );
}

/**
 * Hook to access re-authentication functionality
 */
export function useReauth() {
  const context = useContext(ReauthContext);

  if (!context) {
    throw new Error('useReauth must be used within a ReauthProvider');
  }

  return context;
}
