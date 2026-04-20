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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
  const { currentUser } = useAuth();

  const requestReauth = async (actionDescription: string): Promise<boolean> => {
    if (!currentUser) return false;

    const identities = currentUser.identities ?? [];
    const isGoogle = identities.some(i => i.provider === 'google');
    setProviderType(isGoogle ? 'google' : 'password');

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
    if (!currentUser?.email) return false;

    try {
      if (providerType === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password,
        });
        if (error) throw new Error(error.message);
        return true;
      } else if (providerType === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href },
        });
        if (error) throw new Error(error.message);
        return true;
      }
      return false;
    } catch (error: any) {
      throw error;
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
