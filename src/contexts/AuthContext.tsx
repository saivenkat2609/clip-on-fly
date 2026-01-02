import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  linkWithPopup,
  linkWithCredential,
  unlink,
  OAuthCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { validateEmail } from '@/lib/emailValidator';  // HIGH PRIORITY FIX #11: Removed Gmail-only restriction
import { useToast } from '@/hooks/use-toast';
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

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (options?: { returnCredentialOnConflict?: boolean }) => Promise<void>;
  linkGoogleProvider: (credential: OAuthCredential) => Promise<void>;
  linkPasswordProvider: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const { toast } = useToast();

  // Activity tracking
  const activityTracker = useRef<ActivityTracker | null>(null);

  // Helper function to log session info to Firestore
  async function logSessionInfo(userId: string, method: 'google' | 'password') {
    try {
      const [ipAddress, location] = await Promise.all([
        getClientIP(),
        getLocationFromIP()
      ]);

      await addDoc(collection(db, 'users', userId, 'loginHistory'), {
        timestamp: serverTimestamp(),
        success: true,
        method: method,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        location: location,
        ipAddress: ipAddress,
        flagged: false,
      });
    } catch (error) {
      // Don't fail login if session logging fails
      console.error('Failed to log session:', error);
    }
  }

  async function signUp(email: string, password: string) {
    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(email);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Check if email already exists and what providers are used
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        // Email already exists - guide user to sign in instead
        const hasGoogleProvider = signInMethods.includes('google.com');
        const hasPasswordProvider = signInMethods.includes('password');

        if (hasGoogleProvider && hasPasswordProvider) {
          const error = new Error('This email is already registered. Please sign in using Google or your password.');
          (error as any).code = 'auth/email-already-in-use';
          throw error;
        } else if (hasGoogleProvider) {
          const error = new Error('This email is already registered with Google. Please use "Continue with Google" to sign in.');
          (error as any).code = 'auth/email-already-in-use';
          throw error;
        } else if (hasPasswordProvider) {
          const error = new Error('This email is already registered. Please sign in with your password instead.');
          (error as any).code = 'auth/email-already-in-use';
          throw error;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name from email (username part before @)
      if (userCredential.user) {
        const username = email.split('@')[0];
        // Take first part if email has dots (john.doe -> john)
        const firstName = username.includes('.') ? username.split('.')[0] : username;
        // Capitalize first letter
        const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        await updateProfile(userCredential.user, { displayName });

        // Send email verification
        await sendEmailVerification(userCredential.user);

        // Create user profile in Firestore
        // Set credits expiry to first of next month
        const now = new Date();
        const creditsExpiryDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          displayName: displayName,
          photoURL: null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: false,
          provider: 'password', // Primary provider
          providers: ['password'], // All linked providers
          totalVideos: 0,
          totalClips: 0,
          storageUsed: 0,
          company: '',
          plan: 'Free',
          totalCredits: 30, // Total credits per month for Free plan
          creditsUsed: 0,
          creditsExpiryDate: creditsExpiryDate,
          subscriptionStatus: 'none',
          subscriptionId: null,
          razorpayCustomerId: null,
          preferredCurrency: null, // Will be auto-detected on billing page
          // Free plan features
          maxVideoLength: 900, // 15 minutes in seconds
          exportQuality: '720p',
          hasWatermark: true,
          hasAIViralityScore: false,
          hasCustomBranding: false,
          hasPriorityProcessing: false,
          hasAPIAccess: false,
          theme: 'indigo',
          mode: 'light',
          notifications: {
            processing: true,
            weekly: true,
            marketing: false
          }
        });

        toast({
          title: 'Verification email sent',
          description: 'Please check your email to verify your account.',
        });
      }
    } catch (error: any) {
      // Re-throw the error with our custom message if we set it
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    // First check what sign-in methods are available for this email
    let signInMethods: string[] = [];
    try {
      signInMethods = await fetchSignInMethodsForEmail(auth, email);
    } catch (fetchError: any) {
      // If fetchSignInMethodsForEmail fails, continue to sign-in attempt
      console.log('Could not fetch sign-in methods:', fetchError);
    }

    // If we successfully fetched methods, check them
    if (signInMethods.length > 0) {
      const hasPassword = signInMethods.includes('password');
      const hasGoogle = signInMethods.includes('google.com');

      // If account exists with Google but NO password, block sign-in
      if (hasGoogle && !hasPassword) {
        const error = new Error('This account uses Google sign-in only. Please use the "Continue with Google" button to sign in.');
        (error as any).code = 'auth/wrong-password';
        throw error;
      }

      // If no methods found at all
      if (signInMethods.length === 0) {
        const error = new Error('No account found with this email. Please sign up first.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }
    }

    try {
      // Attempt to sign in with password
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update Firestore last login
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      }, { merge: true });

      // Log session information (non-blocking)
      if (result.user) {
        logSessionInfo(result.user.uid, 'password').catch(console.error);
      }
    } catch (error: any) {
      // Throw original error
      throw error;
    }
  }

  async function signInWithGoogle(options?: { returnCredentialOnConflict?: boolean }) {
    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!email) {
        // Sign out the user since we can't verify their email
        await signOut(auth);
        throw new Error('No email associated with this Google account');
      }

      // For OAuth, Google has already verified the email
      // We only need to check if it's a Gmail domain
      const domain = email.toLowerCase().split('@')[1];
      if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
        await signOut(auth);
        throw new Error('Only Gmail accounts are allowed. Please sign in with a Gmail account.');
      }

      // Check if this email was previously registered with email/password
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      const hasPasswordProvider = signInMethods.includes('password');
      const hasGoogleProvider = signInMethods.includes('google.com');

      // If user already has a password account but not Google, this means Firebase just linked them automatically
      // MongoDB Atlas pattern: we should prevent this and tell them to use their password
      if (hasPasswordProvider && !hasGoogleProvider) {
        // Sign out the automatically created/linked account
        await signOut(auth);

        // If caller wants to handle linking, return the credential
        if (options?.returnCredentialOnConflict) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const error: any = new Error('This email is already registered with a password.');
          error.code = 'auth/account-exists-with-different-credential';
          error.credential = credential;
          error.email = email;
          throw error;
        }

        // Otherwise, throw blocking error
        const error = new Error('This email is already registered with a password. Please sign in using your email and password instead.');
        (error as any).code = 'auth/account-exists-with-different-credential';
        throw error;
      }

      // Google OAuth emails are already verified, no additional checks needed

      // Create or update user profile in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user profile for first-time Google sign-in
        // Set credits expiry to first of next month
        const now = new Date();
        const creditsExpiryDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await setDoc(userDocRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0],
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: true,
          provider: 'google', // Primary provider
          providers: ['google'], // All linked providers
          totalVideos: 0,
          totalClips: 0,
          storageUsed: 0,
          company: '',
          plan: 'Free',
          totalCredits: 30, // Total credits per month for Free plan
          creditsUsed: 0,
          creditsExpiryDate: creditsExpiryDate,
          subscriptionStatus: 'none',
          subscriptionId: null,
          razorpayCustomerId: null,
          preferredCurrency: null, // Will be auto-detected on billing page
          // Free plan features
          maxVideoLength: 900, // 15 minutes in seconds
          exportQuality: '720p',
          hasWatermark: true,
          hasAIViralityScore: false,
          hasCustomBranding: false,
          hasPriorityProcessing: false,
          hasAPIAccess: false,
          theme: 'indigo',
          mode: 'light',
          notifications: {
            processing: true,
            weekly: true,
            marketing: false
          }
        });
      } else {
        // User already exists - update providers array if Google not already linked
        const userData = userDocSnap.data();
        const providers = userData.providers || [userData.provider]; // Fallback for old schema

        // Add 'google' to providers array if not already there (account linking)
        if (!providers.includes('google')) {
          await setDoc(userDocRef, {
            providers: [...providers, 'google'],
            lastLogin: serverTimestamp(),
            photoURL: result.user.photoURL, // Update photo from Google
          }, { merge: true });

          toast({
            title: 'Account linked!',
            description: 'Google sign-in has been linked to your account. You can now use either method to sign in.',
          });
        } else {
          // Just update last login
          await setDoc(userDocRef, {
            lastLogin: serverTimestamp(),
          }, { merge: true });
        }
      }

      // Log session information (non-blocking)
      logSessionInfo(result.user.uid, 'google').catch(console.error);

      toast({
        title: 'Welcome!',
        description: `Signed in as ${result.user.displayName || email}`,
      });
    } catch (error: any) {
      // If user closed the popup, don't show error
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  }

  async function resetPassword(email: string) {
    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(email);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if account exists and what providers it uses
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods.length === 0) {
      // No account exists
      const error = new Error('No account found with this email address. Please sign up first.');
      (error as any).code = 'auth/user-not-found';
      (error as any).shouldShowSignup = true; // Custom flag
      throw error;
    }

    const hasGoogleProvider = signInMethods.includes('google.com');
    const hasPasswordProvider = signInMethods.includes('password');

    if (hasGoogleProvider && !hasPasswordProvider) {
      // Account uses Google only - no password to reset
      const error = new Error('This account uses Google sign-in and does not have a password. Please use the "Continue with Google" button to sign in.');
      (error as any).code = 'auth/no-password-account';
      (error as any).provider = 'google';
      throw error;
    }

    if (!hasPasswordProvider) {
      // Should not happen, but handle edge case
      const error = new Error('This account does not have a password. Please contact support.');
      (error as any).code = 'auth/no-password-account';
      throw error;
    }

    // Account has password provider - send reset email
    await sendPasswordResetEmail(auth, email);
    toast({
      title: 'Password reset email sent',
      description: 'Check your email for instructions to reset your password.',
    });
  }

  async function changeEmail(newEmail: string, currentPassword: string) {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(newEmail);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if new email is already in use
    const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
    if (signInMethods.length > 0) {
      throw new Error('This email is already in use by another account');
    }

    // Reauthenticate user first (required for sensitive operations)
    const credential = EmailAuthProvider.credential(
      currentUser.email!,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);

    // Update email
    await updateEmail(currentUser, newEmail);

    // Send verification email to new address
    await sendEmailVerification(currentUser);

    toast({
      title: 'Email updated',
      description: 'A verification email has been sent to your new address.',
    });
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    if (!currentUser.email) {
      throw new Error('Cannot change password for accounts without email');
    }

    // Check if user signed up with Google (they don't have a password)
    const signInMethods = await fetchSignInMethodsForEmail(auth, currentUser.email);
    if (!signInMethods.includes('password')) {
      throw new Error('This account uses Google sign-in and does not have a password');
    }

    // Reauthenticate user first
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);

    toast({
      title: 'Password updated',
      description: 'Your password has been successfully changed.',
    });
  }

  async function resendVerificationEmail() {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    if (currentUser.emailVerified) {
      throw new Error('Your email is already verified');
    }

    await sendEmailVerification(currentUser);
    toast({
      title: 'Verification email sent',
      description: 'Please check your email inbox.',
    });
  }

  async function refreshUser() {
    if (currentUser) {
      await currentUser.reload();
      setCurrentUser({ ...currentUser });
    }
  }

  // Get linked providers
  function getLinkedProviders() {
    if (!currentUser) {
      return { google: false, password: false };
    }

    const providers = currentUser.providerData.map(p => p.providerId);
    return {
      google: providers.includes('google.com'),
      password: providers.includes('password'),
    };
  }

  // Link Google provider to existing account
  async function linkGoogleProvider(credential: OAuthCredential) {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      // Link the Google credential to the existing password account
      const result = await linkWithCredential(currentUser, credential);

      // Update Firestore to reflect both providers
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        providers: ['password', 'google'], // Track both providers
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Log the account linking
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'accountLinkingHistory'), {
          action: 'link',
          provider: 'google',
          timestamp: serverTimestamp(),
          ipAddress: await getClientIP(),
        });
      } catch (error) {
        console.error('Failed to log account linking:', error);
      }

      toast({
        title: 'Account linked successfully!',
        description: 'You can now sign in using Google or your password.',
      });

      // Refresh user to get updated provider data
      await refreshUser();
    } catch (error: any) {
      console.error('Failed to link Google provider:', error);
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error('This Google account is already linked to another user');
      }
      throw error;
    }
  }

  // Link password provider to existing Google-only account
  async function linkPasswordProvider(password: string) {
    if (!currentUser || !currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    const { google, password: hasPassword } = getLinkedProviders();
    if (hasPassword) {
      throw new Error('Password authentication is already set up');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Create email/password credential
      const credential = EmailAuthProvider.credential(currentUser.email, password);

      // Link the password credential to the existing account
      await linkWithCredential(currentUser, credential);

      // Update Firestore to reflect both providers
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        providers: google ? ['password', 'google'] : ['password'], // Track all providers
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Log the account linking
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'accountLinkingHistory'), {
          action: 'link',
          provider: 'password',
          timestamp: serverTimestamp(),
          ipAddress: await getClientIP(),
        });
      } catch (error) {
        console.error('Failed to log account linking:', error);
      }

      toast({
        title: 'Password added successfully!',
        description: 'You can now sign in using your password or Google.',
      });

      // Refresh user to get updated provider data
      await refreshUser();
    } catch (error: any) {
      console.error('Failed to link password provider:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already in use by another account');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      throw error;
    }
  }

  // Unlink a provider (requires at least one method to remain)
  async function unlinkProvider(providerId: 'google.com' | 'password') {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    const { google, password } = getLinkedProviders();
    const providerCount = (google ? 1 : 0) + (password ? 1 : 0);

    if (providerCount <= 1) {
      throw new Error('Cannot unlink your only sign-in method. Please add another method first.');
    }

    const providerName = providerId === 'google.com' ? 'Google' : 'password';

    try {
      await unlink(currentUser, providerId);

      // Log the unlinking
      await addDoc(collection(db, 'users', currentUser.uid, 'accountLinkingHistory'), {
        action: 'unlink',
        provider: providerId === 'google.com' ? 'google' : 'password',
        timestamp: serverTimestamp(),
        ipAddress: await getClientIP(),
      });

      toast({
        title: `${providerName} unlinked`,
        description: `You can no longer sign in with ${providerName}.`,
      });

      // Refresh user to get updated provider data
      await refreshUser();
    } catch (error: any) {
      if (error.code === 'auth/no-such-provider') {
        throw new Error(`${providerName} is not linked to your account`);
      }
      throw error;
    }
  }

  // Initialize activity tracker
  useEffect(() => {
    activityTracker.current = new ActivityTracker();
    activityTracker.current.onActivity(() => {
      setShowInactivityWarning(false);
    });

    return () => {
      activityTracker.current = null;
    };
  }, []);

  // Check for inactivity and auto-logout
  useEffect(() => {
    if (!currentUser || !activityTracker.current) return;

    const interval = setInterval(() => {
      if (!activityTracker.current) return;

      const inactiveTime = activityTracker.current.getInactiveTime();

      // UI/UX FIX #85: Show warning 5 minutes before auto-logout with extension option
      if (inactiveTime > INACTIVITY_TIMEOUT - INACTIVITY_WARNING_TIME &&
          inactiveTime < INACTIVITY_TIMEOUT) {
        if (!showInactivityWarning) {
          setShowInactivityWarning(true);
          const remainingMinutes = Math.ceil((INACTIVITY_TIMEOUT - inactiveTime) / 60000);
          toast({
            title: 'Inactivity Warning',
            description: `You will be automatically signed out in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} due to inactivity.`,
            action: {
              label: 'Extend Session',
              onClick: () => {
                // Reset last activity to extend session
                updateLastActivity();
                setShowInactivityWarning(false);
                toast({
                  title: 'Session Extended',
                  description: 'Your session has been extended for another 30 minutes.',
                  duration: 3000,
                });
              },
            },
            duration: 10000,
          });
        }
      }

      // Auto logout after inactivity timeout
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        logout();
        toast({
          title: 'Signed out due to inactivity',
          description: 'You were automatically signed out after 30 minutes of inactivity. Please sign in again to continue.',
          duration: 7000,
        });
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, showInactivityWarning]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
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
