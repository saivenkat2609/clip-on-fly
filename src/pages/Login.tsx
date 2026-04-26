import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mail, Lock, Chrome, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { validateEmail } from '@/lib/emailValidator';  // HIGH PRIORITY FIX #11: Removed Gmail-only restriction
import { supabase } from '@/lib/supabase';

// Replaces Firebase's fetchSignInMethodsForEmail — queries our users table
async function getEmailProviders(email: string): Promise<string[]> {
  const { data } = await supabase.from('users').select('providers').eq('email', email).maybeSingle();
  return data?.providers ?? [];
}
import { PasswordInput } from '@/components/PasswordInput';
import { setSessionPersistence } from '@/lib/sessionManager';
import { cn } from '@/lib/utils';
import { AccountLinkingModal } from '@/components/AccountLinkingModal';
import { LegalModal } from '@/components/LegalModal';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Remember Me and failed login tracking
  const [rememberMe, setRememberMe] = useState(true);

  // UI/UX FIX #91: Persistent failed login tracking (survives page refresh)
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(() => {
    try {
      const stored = localStorage.getItem('failedLoginAttempts');
      const data = stored ? JSON.parse(stored) : { count: 0, timestamp: Date.now() };
      // Reset if older than 1 hour
      if (Date.now() - data.timestamp > 3600000) {
        localStorage.removeItem('failedLoginAttempts');
        return 0;
      }
      return data.count;
    } catch {
      return 0;
    }
  });

  // Helper to update failed attempts in both state and localStorage
  const updateFailedAttempts = useCallback((count: number) => {
    setFailedLoginAttempts(count);
    if (count === 0) {
      localStorage.removeItem('failedLoginAttempts');
    } else {
      localStorage.setItem('failedLoginAttempts', JSON.stringify({ count, timestamp: Date.now() }));
    }
  }, []);

  // Provider conflict state (for MongoDB Atlas style prompts)
  const [providerConflict, setProviderConflict] = useState<{
    email: string;
    suggestedProvider: 'google' | 'password';
    message: string;
  } | null>(null);

  // Separate state for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });

  // Real-time provider detection for login form
  const [loginEmailProvider, setLoginEmailProvider] = useState<{
    status: 'idle' | 'checking' | 'detected';
    provider: 'google' | 'password' | 'none' | null;
    message: string;
  } | null>(null);

  // Ref for debouncing provider check
  const providerCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Account linking modal state
  const [linkingModal, setLinkingModal] = useState<{
    open: boolean;
    email: string;
    existingProvider: 'password' | 'google';
    newProvider: 'password' | 'google';
    pendingCredential: any;
  } | null>(null);

  // Legal modal state
  const [legalModal, setLegalModal] = useState<{
    open: boolean;
    type: 'terms' | 'privacy';
  }>({ open: false, type: 'terms' });

  // Separate state for signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState({ email: '', password: '', confirmPassword: '' });
  const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Password validation state for signup
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);

  const { signIn, signUp, signInWithGoogle, linkGoogleProvider, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Reset forms when switching between login/signup
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginErrors({ email: '', password: '' });
    setLoginEmailProvider(null);
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupErrors({ email: '', password: '', confirmPassword: '' });
    setEmailValidationStatus('idle');
    // Don't clear providerConflict - it should persist to show the user what went wrong
    setIsPasswordBreached(false);
  }, [isSignUp]);

  // Handle query parameter for signup redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [location.search]);

  // Auto-redirect authenticated users (prevents flash of login page)
  useEffect(() => {
    // Only redirect if:
    // 1. Auth state is stable (not loading)
    // 2. User is authenticated
    // 3. Not currently processing a login/signup action
    if (!authLoading && currentUser && !googleLoading && !loading) {
      // Check if user should be redirected to billing (from landing page)
      const shouldRedirectToBilling = sessionStorage.getItem('redirectToBilling');
      if (shouldRedirectToBilling === 'true') {
        sessionStorage.removeItem('redirectToBilling');
        navigate('/billing', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [currentUser, authLoading, googleLoading, loading, navigate, from]);

  // UI/UX FIX #90: Debounced email API check
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkEmailExists = useCallback(async (email: string) => {
    // Check if email already exists
    try {
      const signInMethods = await getEmailProviders(email);
      if (signInMethods.length > 0) {
        setEmailValidationStatus('invalid');
        const hasGoogle = signInMethods.includes("google");
        const hasPassword = signInMethods.includes('password');

        if (hasGoogle) {
          setSignupErrors(prev => ({
            ...prev,
            email: 'This email is already registered with Google. Please use "Continue with Google" to sign in.'
          }));
        } else if (hasPassword) {
          setSignupErrors(prev => ({
            ...prev,
            email: 'This email is already registered. Please sign in with your password instead.'
          }));
        }
      } else {
        setEmailValidationStatus('valid');
      }
    } catch (error) {
      // If check fails, just show as valid (will be caught during signup)
      setEmailValidationStatus('valid');
    }
  }, []);

  // Real-time email validation for signup with debouncing
  const handleSignupEmailChange = async (email: string) => {
    setSignupEmail(email);
    setSignupErrors(prev => ({ ...prev, email: '' }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!email || email.length < 3) {
      setEmailValidationStatus('idle');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidationStatus('idle');
      return;
    }

    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setEmailValidationStatus('invalid');
      setSignupErrors(prev => ({ ...prev, email: validation.error || '' }));
      return;
    }

    // UI/UX FIX #90: Debounce API call by 500ms
    debounceTimerRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 500);
  };

  // Real-time provider detection for login form with debouncing
  const handleLoginEmailChange = (email: string) => {
    setLoginEmail(email);
    setLoginErrors(prev => ({ ...prev, email: '' }));

    // Clear previous timer
    if (providerCheckTimerRef.current) {
      clearTimeout(providerCheckTimerRef.current);
    }

    // Basic validation first (instant)
    if (!email || email.length < 3) {
      setLoginEmailProvider(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginEmailProvider(null);
      return;
    }

    // Debounce the API call (500ms)
    setLoginEmailProvider({ status: 'checking', provider: null, message: '' });
    providerCheckTimerRef.current = setTimeout(async () => {
      try {
        console.log('Checking sign-in methods for:', email);
        const signInMethods = await getEmailProviders(email);
        console.log('Sign-in methods found:', signInMethods);

        if (signInMethods.length === 0) {
          console.log('No sign-in methods found for:', email);
          // Don't show any message - Email Enumeration Protection is likely enabled
          setLoginEmailProvider(null);
        } else if (signInMethods.includes("google") && !signInMethods.includes('password')) {
          console.log('Google-only account detected for:', email);
          setLoginEmailProvider({
            status: 'detected',
            provider: 'google',
            message: 'A Google account exists with this email. Please sign in with Google, then you can add a password in Settings.'
          });
        } else if (signInMethods.includes('password')) {
          console.log('Password account detected for:', email);
          setLoginEmailProvider({
            status: 'detected',
            provider: 'password',
            message: 'This email uses password sign-in.'
          });
        }
      } catch (error) {
        // Log the error for debugging
        console.error('Error checking sign-in methods:', error);
        // Show a message that we couldn't check
        setLoginEmailProvider({
          status: 'detected',
          provider: null,
          message: 'Unable to verify account. Please try signing in.'
        });
      }
    }, 500);
  };

  // Validate login form
  const validateLoginForm = (): boolean => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!loginEmail) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!loginPassword) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (loginPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setLoginErrors(errors);
    return isValid;
  };

  // Validate signup form
  const validateSignupForm = (): boolean => {
    const errors = { email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!signupEmail) {
      errors.email = 'Email is required';
      isValid = false;
    } else {
      // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
      const validation = validateEmail(signupEmail);
      if (!validation.isValid) {
        errors.email = validation.error || 'Invalid email';
        isValid = false;
      }
    }

    if (!signupPassword) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (signupPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!signupConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (signupPassword !== signupConfirmPassword) {
      errors.confirmPassword = "Passwords don't match";
      isValid = false;
    }

    setSignupErrors(errors);
    return isValid;
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    setLoading(true);
    setProviderConflict(null);
    try {
      // Set session persistence based on Remember Me checkbox
      await setSessionPersistence(rememberMe);

      await signIn(loginEmail, loginPassword);

      // Reset failed attempts on successful login
      updateFailedAttempts(0);

      // Check if user should be redirected to billing
      const shouldRedirectToBilling = sessionStorage.getItem('redirectToBilling');
      if (shouldRedirectToBilling === 'true') {
        toast({
          title: 'Welcome back!',
          description: 'Redirecting you to billing...',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      }
      // Navigation handled by auto-redirect useEffect
    } catch (error: any) {
      // Check if account exists with Google only (MongoDB Atlas pattern)
      if ((error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') && error.message.includes('Google sign-in')) {
        setProviderConflict({
          email: loginEmail,
          suggestedProvider: 'google',
          message: error.message || 'This account was created with Google. Please use the "Continue with Google" button to sign in.',
        });
      } else if (error.code === 'auth/user-not-found') {
        // Check if there might be a Google account
        try {
          const methods = await getEmailProviders(loginEmail);
          if (methods.includes('google.com')) {
            // Google account exists, show provider conflict
            setProviderConflict({
              email: loginEmail,
              suggestedProvider: 'google',
              message: 'This email has a Google account. Please use "Continue with Google" to sign in, then add a password in Settings if needed.',
            });
          } else {
            // Cannot determine if Google account exists (Email Enumeration Protection)
            // Show helpful message that covers both cases
            setProviderConflict({
              email: loginEmail,
              suggestedProvider: 'google',
              message: 'No password found for this email. If you signed up with Google, use "Continue with Google" below. Otherwise, please sign up.',
            });
          }
        } catch {
          // If provider check fails, show helpful message
          setProviderConflict({
            email: loginEmail,
            suggestedProvider: 'google',
            message: 'No password found for this email. If you signed up with Google, use "Continue with Google" below. Otherwise, please sign up.',
          });
        }
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // Track failed attempts
        const newAttempts = failedLoginAttempts + 1;
        updateFailedAttempts(newAttempts);

        setLoginErrors(prev => ({
          ...prev,
          password: 'Incorrect password. Please try again.'
        }));
      } else if (error.code === 'auth/too-many-requests') {
        setLoginErrors(prev => ({
          ...prev,
          password: 'Too many failed attempts. Please wait before trying again.'
        }));
      } else if (error.message) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignupForm()) return;

    setLoading(true);
    setProviderConflict(null);
    try {
      // Set persistent session for new signups (default to 7 days)
      await setSessionPersistence(true);

      await signUp(signupEmail, signupPassword);

      // Check if user should be redirected to billing
      const shouldRedirectToBilling = sessionStorage.getItem('redirectToBilling');
      if (shouldRedirectToBilling === 'true') {
        toast({
          title: 'Account created successfully!',
          description: 'Welcome to Clip on Fly! Redirecting you to billing...',
        });
      } else {
        toast({
          title: 'Account created successfully!',
          description: 'Welcome to Clip on Fly! A verification email has been sent to your inbox.',
        });
      }
      // Navigation handled by auto-redirect useEffect
    } catch (error: any) {
      // Check for provider conflicts (MongoDB Atlas pattern)
      if (error.code === 'auth/email-already-in-use' && error.message.includes('Google')) {
        setProviderConflict({
          email: signupEmail,
          suggestedProvider: 'google',
          message: error.message,
        });
        // Switch to login mode
        setIsSignUp(false);
      } else if (error.code === 'auth/email-already-in-use' && error.message.includes('password')) {
        setProviderConflict({
          email: signupEmail,
          suggestedProvider: 'password',
          message: error.message,
        });
        // Switch to login mode
        setIsSignUp(false);
      } else if (error.code === 'auth/email-already-in-use') {
        // Generic email-already-in-use (Email Enumeration Protection active)
        // Show helpful provider conflict alert with both options
        setProviderConflict({
          email: signupEmail,
          suggestedProvider: 'google', // Suggest Google first, but show both options
          message: 'This email is already registered. Try signing in with Google, or use your password below.',
        });
        // Switch to login mode and pre-fill email
        setIsSignUp(false);
        setLoginEmail(signupEmail);
      } else if (error.code === 'auth/weak-password') {
        setSignupErrors(prev => ({
          ...prev,
          password: 'Password is too weak. Please use a stronger password.'
        }));
      } else if (error.code === 'auth/invalid-email') {
        setSignupErrors(prev => ({
          ...prev,
          email: 'Invalid email address format.'
        }));
      } else if (error.message) {
        // For other errors, show a toast
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setProviderConflict(null);
    try {
      // Set session persistence based on Remember Me checkbox (only in login mode)
      if (!isSignUp) {
        await setSessionPersistence(rememberMe);
      } else {
        // Default to persistent for signups
        await setSessionPersistence(true);
      }

      // Try to sign in with Google, with credential return on conflict
      await signInWithGoogle({ returnCredentialOnConflict: true });

      // Check if user should be redirected to billing
      const shouldRedirectToBilling = sessionStorage.getItem('redirectToBilling');
      if (shouldRedirectToBilling === 'true') {
        // Don't show toast here - auto-redirect will handle it
      }
      // Navigation handled by auto-redirect useEffect
    } catch (error: any) {
      // Check if it's a provider conflict error that we can link
      if (error.code === 'auth/account-exists-with-different-credential' && error.credential) {
        // Show linking modal
        setLinkingModal({
          open: true,
          email: error.email,
          existingProvider: 'password',
          newProvider: 'google',
          pendingCredential: error.credential
        });
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        // No credential available, show error
        setProviderConflict({
          email: '',
          suggestedProvider: 'password',
          message: error.message || 'This email is already registered with a password. Please sign in using your email and password instead.',
        });
        // Switch to login mode if in signup
        if (isSignUp) {
          setIsSignUp(false);
        }
      } else if (error.message) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle account linking confirmation
  const handleConfirmLinking = async () => {
    if (!linkingModal?.pendingCredential) return;

    setGoogleLoading(true);
    try {
      // Link the Google credential to the existing password account
      await linkGoogleProvider();

      setLinkingModal(null);
      toast({
        title: 'Account linked!',
        description: 'You can now sign in with Google or password.',
      });
      // Navigation handled by auto-redirect useEffect
    } catch (error: any) {
      toast({
        title: 'Failed to link account',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle account linking cancellation
  const handleCancelLinking = () => {
    setLinkingModal(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Full-screen loader during authentication transition */}
      {!authLoading && currentUser && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary animate-pulse">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 bg-transparent">
        <div className="container mx-auto px-6 py-6">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Clip on Fly
            </span>
          </Link>
        </div>
      </nav>

      {/* Split Screen Layout */}
      <div className="flex-1 flex">
        {/* Left Side - Visual Content */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
            <div className="max-w-lg space-y-8">
              {/* Hero Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
                    <Sparkles className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Transform Videos into Viral Clips
                </h1>
                <p className="text-lg text-muted-foreground">
                  AI-powered video editing that turns long-form content into
                  engaging short clips automatically
                </p>
              </div>

              {/* Features */}
              <div className="grid gap-4 text-left mt-8">
                {[
                  {
                    icon: "⚡",
                    title: "Lightning Fast",
                    desc: "Process videos in minutes, not hours",
                  },
                  {
                    icon: "🎨",
                    title: "Beautiful Templates",
                    desc: "Professional designs for every platform",
                  },
                  {
                    icon: "🚀",
                    title: "Boost Engagement",
                    desc: "Maximize reach with optimized clips",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur border border-border/50"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://pub-a42da8500209450c8fb64926d3bcd10a.r2.dev/Avatars/avatar${i}.png`}
                      alt={`Creator ${i}`}
                      className="h-8 w-8 rounded-full border-2 border-background object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Join{" "}
                  <span className="font-semibold text-foreground">500+</span>{" "}
                  creators
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 h-64 w-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 h-64 w-64 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-border/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </CardTitle>
                <CardDescription className="text-center">
                  {isSignUp
                    ? "Sign up to start creating amazing content"
                    : "Sign in to your account to continue"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider Conflict Alert (MongoDB Atlas Style) */}
                {providerConflict && (
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">{providerConflict.message}</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {googleLoading ? "Signing in..." : "Continue with Google"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Sign Up Form */}
                {isSignUp ? (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="signup-email"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) =>
                            handleSignupEmailChange(e.target.value)
                          }
                          disabled={loading}
                          className={`pl-10 ${
                            emailValidationStatus === "valid"
                              ? "pr-10 border-green-500 focus:border-green-500"
                              : emailValidationStatus === "invalid"
                                ? "pr-10 border-red-500 focus:border-red-500"
                                : "pr-10"
                          }`}
                        />
                        {emailValidationStatus === "valid" && (
                          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                        )}
                        {emailValidationStatus === "invalid" && (
                          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {emailValidationStatus === "valid" &&
                        !signupErrors.email && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Valid email address
                          </p>
                        )}
                      {signupErrors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signupErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Enhanced Password Input with Strength Meter */}
                    <PasswordInput
                      label="Password"
                      value={signupPassword}
                      onChange={(value) => {
                        setSignupPassword(value);
                        setSignupErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="Create a strong password"
                      showStrengthMeter={true}
                      checkBreaches={true}
                      error={signupErrors.password}
                      required={true}
                      autoComplete="new-password"
                      onBreachStatusChange={setIsPasswordBreached}
                    />

                    <div className="space-y-2">
                      <label
                        htmlFor="signup-confirm-password"
                        className="text-sm font-medium"
                      >
                        Confirm Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSignupConfirmPassword(value);
                            // UI/UX FIX #87: Real-time password match feedback
                            if (
                              value &&
                              signupPassword &&
                              value !== signupPassword
                            ) {
                              setSignupErrors((prev) => ({
                                ...prev,
                                confirmPassword: "Passwords don't match",
                              }));
                            } else {
                              setSignupErrors((prev) => ({
                                ...prev,
                                confirmPassword: "",
                              }));
                            }
                          }}
                          disabled={loading}
                          className="pl-10"
                        />
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {signupErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Disable button if password is breached or too short */}
                    <Button
                      type="submit"
                      className="w-full gradient-primary"
                      disabled={
                        loading ||
                        isPasswordBreached ||
                        signupPassword.length < 8 ||
                        signupPassword !== signupConfirmPassword ||
                        emailValidationStatus === "invalid"
                      }
                    >
                      {loading ? "Creating account..." : "Create account"}
                    </Button>

                    {/* Helper text when button is disabled */}
                    {!loading &&
                      (isPasswordBreached ||
                        signupPassword.length < 8 ||
                        signupPassword !== signupConfirmPassword) &&
                      signupPassword && (
                        <p className="text-xs text-center text-muted-foreground">
                          {isPasswordBreached &&
                            "⚠️ Cannot create account with breached password"}
                          {!isPasswordBreached &&
                            signupPassword.length < 8 &&
                            "⚠️ Password must be at least 8 characters"}
                          {!isPasswordBreached &&
                            signupPassword.length >= 8 &&
                            signupPassword !== signupConfirmPassword &&
                            "⚠️ Passwords must match"}
                        </p>
                      )}
                  </form>
                ) : (
                  /* Login Form */
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="login-email"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) =>
                            handleLoginEmailChange(e.target.value)
                          }
                          disabled={loading}
                          className={cn(
                            "pl-10",
                            loginEmailProvider?.provider === "google" &&
                              "border-blue-500",
                          )}
                        />
                      </div>

                      {/* Provider detection hint */}
                      {loginEmailProvider?.status === "detected" &&
                        loginEmailProvider.provider === "google" && (
                          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium">
                                {loginEmailProvider.message}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={handleGoogleSignIn}
                              >
                                <Chrome className="mr-2 h-3 w-3" />
                                Sign in with Google
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}

                      {loginEmailProvider?.status === "detected" &&
                        loginEmailProvider.provider === "none" && (
                          <p className="text-sm text-orange-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {loginEmailProvider.message}
                          </p>
                        )}

                      {loginErrors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {loginErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="login-password"
                        className="text-sm font-medium"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginErrors((prev) => ({
                              ...prev,
                              password: "",
                            }));
                          }}
                          disabled={loading}
                          className="pl-10"
                        />
                      </div>
                      {loginErrors.password && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {loginErrors.password}
                        </p>
                      )}

                      {/* Failed Attempts Warning */}
                      {failedLoginAttempts >= 3 && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                              {5 - failedLoginAttempts > 0
                                ? `${5 - failedLoginAttempts} attempts left`
                                : "Too many attempts"}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                              Try "Forgot password?" if you need help
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) =>
                            setRememberMe(!!checked)
                          }
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor="remember-me"
                          className="text-sm font-medium cursor-pointer select-none"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground text-center">
                  {isSignUp ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setProviderConflict(null); // Clear alert on manual switch
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(true);
                          setProviderConflict(null); // Clear alert on manual switch
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setLegalModal({ open: true, type: "terms" })
                      }
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setLegalModal({ open: true, type: "privacy" })
                      }
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                    . We do not accept temporary or disposable email addresses.
                  </p>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Account Linking Modal */}
      {linkingModal && (
        <AccountLinkingModal
          open={linkingModal.open}
          onOpenChange={(open) => !open && setLinkingModal(null)}
          onConfirm={handleConfirmLinking}
          onCancel={handleCancelLinking}
          email={linkingModal.email}
          existingProvider={linkingModal.existingProvider}
          newProvider={linkingModal.newProvider}
          loading={googleLoading}
        />
      )}

      {/* Legal Modal (Terms & Privacy) */}
      <LegalModal
        open={legalModal.open}
        onOpenChange={(open) => setLegalModal({ ...legalModal, open })}
        type={legalModal.type}
      />
    </div>
  );
}
