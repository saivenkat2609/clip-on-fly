import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { validateEmailStrictGmailOnly } from '@/lib/emailValidator';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const { toast } = useToast();

  async function signUp(email: string, password: string) {
    // STRICT validation - only Gmail addresses allowed
    const validation = validateEmailStrictGmailOnly(email);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Check if email already exists and what providers are used
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        // Email already exists
        const hasGoogleProvider = signInMethods.includes('google.com');
        const hasPasswordProvider = signInMethods.includes('password');

        if (hasGoogleProvider) {
          const error = new Error('This email is already registered with Google. Please use the "Continue with Google" button to sign in.');
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
          provider: 'password',
          totalVideos: 0,
          totalClips: 0,
          storageUsed: 0,
          company: '',
          plan: 'Free',
          totalCredits: 60, // Total credits per month for Free plan
          creditsExpiryDate: creditsExpiryDate,
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
    try {
      // Check what sign-in methods are available for this email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length === 0) {
        // No account exists
        const error = new Error('No account found with this email. Please sign up first.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }

      const hasGoogleProvider = signInMethods.includes('google.com');
      const hasPasswordProvider = signInMethods.includes('password');

      if (hasGoogleProvider && !hasPasswordProvider) {
        // Account exists with Google only
        const error = new Error('This account was created with Google. Please use the "Continue with Google" button to sign in.');
        (error as any).code = 'auth/wrong-password';
        throw error;
      }

      // Attempt to sign in with password
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If it's a Firebase auth error, let it pass through
      // Our custom errors already have the right code
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      // First, get the Google account email to check existing providers
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
          provider: 'google',
          totalVideos: 0,
          totalClips: 0,
          storageUsed: 0,
          company: '',
          plan: 'Free',
          totalCredits: 60, // Total credits per month for Free plan
          creditsExpiryDate: creditsExpiryDate,
          theme: 'indigo',
          mode: 'light',
          notifications: {
            processing: true,
            weekly: true,
            marketing: false
          }
        });
      } else {
        // Update last login for existing user
        await setDoc(userDocRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

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
    // Validate email format
    const validation = validateEmailStrictGmailOnly(email);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Send password reset email
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

    // Validate new email
    const validation = validateEmailStrictGmailOnly(newEmail);
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
    logout,
    resetPassword,
    changeEmail,
    changePassword,
    resendVerificationEmail,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
