import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/emailValidator';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityTracker,
  INACTIVITY_TIMEOUT,
  INACTIVITY_WARNING_TIME,
  getDeviceType,
  getBrowser,
  getOS,
  getClientIP,
  getLocationFromIP,
} from '@/lib/sessionManager';

// Extend Supabase User to include .uid alias and .displayName extracted from user_metadata
type AppUser = User & { uid: string; displayName: string | null };

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (options?: { returnCredentialOnConflict?: boolean }) => Promise<void>;
  linkGoogleProvider: () => Promise<void>;
  linkPasswordProvider: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  unlinkProvider: (providerId: 'google.com' | 'password') => Promise<void>;
  getLinkedProviders: () => { google: boolean; password: boolean };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

function toAppUser(user: User): AppUser {
  const meta = user.user_metadata ?? {};
  // Google sets full_name; email sign-up stores full_name or display_name in metadata
  const displayName = meta.full_name ?? meta.name ?? meta.display_name ?? null;
  return { ...user, uid: user.id, displayName };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activityTracker = useRef<ActivityTracker | null>(null);

  // Helper: log session info to Supabase DB
  async function logSessionInfo(userId: string, method: 'google' | 'password') {
    try {
      const [ipAddress, location] = await Promise.all([getClientIP(), getLocationFromIP()]);
      await supabase.from('login_history').insert({
        user_id: userId,
        success: true,
        method,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        location,
        ip_address: ipAddress,
        flagged: false,
      });
    } catch (error) {
      console.error('Failed to log session:', error);
    }
  }


  async function signUp(email: string, password: string) {
    const validation = validateEmail(email);
    if (!validation.isValid) throw new Error(validation.error);

    const username = email.split('@')[0];
    const firstName = username.includes('.') ? username.split('.')[0] : username;
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    // Pass full_name in metadata so the DB trigger picks it up at insert time
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });

    if (error) throw new Error(error.message);

    toast({
      title: 'Verification email sent',
      description: 'Please check your email to verify your account.',
    });
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect email or password.');
      }
      throw new Error(error.message);
    }

    // last_login is updated in onAuthStateChange SIGNED_IN — no duplicate write needed here
    if (data.user) {
      logSessionInfo(data.user.id, 'password').catch(console.error);
    }
  }

  async function signInWithGoogle(options?: { returnCredentialOnConflict?: boolean }) {
    // Supabase handles the redirect — Google popup is replaced by a redirect flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) throw new Error(error.message);
    // After redirect, onAuthStateChange fires and handles profile creation
  }

  async function logout() {
    if (currentUser?.uid) {
      try {
        sessionStorage.removeItem(`user_profile_${currentUser.uid}`);
      } catch (error) {
        console.error('Failed to clear session cache:', error);
      }
    }

    queryClient.clear();
    await supabase.auth.signOut();

    toast({ title: 'Signed out', description: 'You have been successfully signed out.' });
  }

  async function resetPassword(email: string) {
    const validation = validateEmail(email);
    if (!validation.isValid) throw new Error(validation.error);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw new Error(error.message);

    toast({
      title: 'Password reset email sent',
      description: 'Check your email for instructions to reset your password.',
    });
  }

  async function changeEmail(newEmail: string, currentPassword: string) {
    if (!currentUser) throw new Error('No user is currently signed in');

    const validation = validateEmail(newEmail);
    if (!validation.isValid) throw new Error(validation.error);

    // Re-verify identity by signing in again
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: currentUser.email!,
      password: currentPassword,
    });
    if (reAuthError) throw new Error('Current password is incorrect');

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw new Error(error.message);

    toast({ title: 'Email updated', description: 'A verification email has been sent to your new address.' });
  }

  async function changePassword(newPassword: string) {
    if (!currentUser) throw new Error('No user is currently signed in');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async function resendVerificationEmail() {
    if (!currentUser) throw new Error('No user is currently signed in');
    if (currentUser.email_confirmed_at) throw new Error('Your email is already verified');

    const { error } = await supabase.auth.resend({ type: 'signup', email: currentUser.email! });
    if (error) throw new Error(error.message);

    toast({ title: 'Verification email sent', description: 'Please check your email inbox.' });
  }

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) setCurrentUser(toAppUser(data.user));
  }

  function getLinkedProviders() {
    if (!currentUser) return { google: false, password: false };
    const identities = currentUser.identities ?? [];
    return {
      google: identities.some(i => i.provider === 'google'),
      // updateUser({ password }) doesn't add an email identity, so also check metadata flag
      password: identities.some(i => i.provider === 'email') || currentUser.user_metadata?.has_password === true,
    };
  }

  async function linkGoogleProvider() {
    // linkWithOAuth exists on GoTrueClient but not on the SupabaseAuthClient proxy type
    const { error } = await (supabase.auth as any).linkWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }

  async function linkPasswordProvider(password: string) {
    if (!currentUser?.email) throw new Error('No user is currently signed in');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');

    const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
    if (error) throw new Error(error.message);

    await refreshUser();
  }

  async function unlinkProvider(providerId: 'google.com' | 'password') {
    if (!currentUser) throw new Error('No user is currently signed in');

    const { google, password } = getLinkedProviders();
    const providerCount = (google ? 1 : 0) + (password ? 1 : 0);
    if (providerCount <= 1) throw new Error('Cannot unlink your only sign-in method.');

    const identities = currentUser.identities ?? [];
    const supabaseProvider = providerId === 'google.com' ? 'google' : 'email';
    const identity = identities.find(i => i.provider === supabaseProvider);

    if (!identity && providerId === 'password') {
      // Password was added via updateUser (no email identity) — invalidate it with a random unknown password
      const randomPassword = crypto.randomUUID() + Date.now().toString(36) + '!A1x';
      const { error } = await supabase.auth.updateUser({ password: randomPassword, data: { has_password: false } });
      if (error) throw new Error(error.message);
      await refreshUser();
      return;
    }

    if (!identity) throw new Error('Provider not linked to this account');

    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) throw new Error(error.message);

    await refreshUser();
  }

  // Activity tracker init
  useEffect(() => {
    activityTracker.current = new ActivityTracker();
    activityTracker.current.onActivity(() => setShowInactivityWarning(false));
    return () => { activityTracker.current = null; };
  }, []);

  // Inactivity auto-logout
  useEffect(() => {
    if (!currentUser || !activityTracker.current) return;

    const interval = setInterval(() => {
      if (!activityTracker.current) return;
      const inactiveTime = activityTracker.current.getInactiveTime();

      if (inactiveTime > INACTIVITY_TIMEOUT - INACTIVITY_WARNING_TIME && inactiveTime < INACTIVITY_TIMEOUT) {
        if (!showInactivityWarning) {
          setShowInactivityWarning(true);
          const remainingMinutes = Math.ceil((INACTIVITY_TIMEOUT - inactiveTime) / 60000);
          sonnerToast('Inactivity Warning', {
            description: `You will be signed out in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
            action: {
              label: 'Extend Session',
              onClick: () => {
                setShowInactivityWarning(false);
                sonnerToast.success('Session extended');
              },
            },
            duration: 10000,
          });
        }
      }

      if (inactiveTime > INACTIVITY_TIMEOUT) {
        logout();
        toast({
          title: 'Signed out due to inactivity',
          description: 'You were automatically signed out after 30 minutes of inactivity.',
          duration: 7000,
        });
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser, showInactivityWarning]);

  // Auth state listener — replaces Firebase's onAuthStateChanged
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ? toAppUser(session.user) : null;
      setCurrentUser(user);
      setLoading(false);

      // SIGNED_IN fires on fresh sign-in; INITIAL_SESSION fires on page reload with existing session
      // Only update last_login on a real sign-in, not on every page reload
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', session.user.id).then(() => {});
        const isGoogle = session.user.identities?.some(i => i.provider === 'google');
        if (isGoogle) {
          logSessionInfo(session.user.id, 'google').catch(console.error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    linkGoogleProvider,
    linkPasswordProvider,
    logout,
    resetPassword,
    changeEmail,
    changePassword,
    resendVerificationEmail,
    refreshUser,
    unlinkProvider,
    getLinkedProviders,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
