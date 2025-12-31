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
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { PasswordInput } from '@/components/PasswordInput';
import { setSessionPersistence } from '@/lib/sessionManager';

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

  // Separate state for signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState({ email: '', password: '', confirmPassword: '' });
  const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Password validation state for signup
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Reset forms when switching between login/signup
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginErrors({ email: '', password: '' });
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupErrors({ email: '', password: '', confirmPassword: '' });
    setEmailValidationStatus('idle');
    setProviderConflict(null);
    setIsPasswordBreached(false);
  }, [isSignUp]);

  // UI/UX FIX #90: Debounced email API check
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkEmailExists = useCallback(async (email: string) => {
    // Check if email already exists
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setEmailValidationStatus('invalid');
        const hasGoogle = signInMethods.includes('google.com');
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

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      // Check if account exists with Google only (MongoDB Atlas pattern)
      if ((error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') && error.message.includes('Google sign-in')) {
        setProviderConflict({
          email: loginEmail,
          suggestedProvider: 'google',
          message: error.message || 'This account was created with Google. Please use the "Continue with Google" button to sign in.',
        });
      } else if (error.code === 'auth/user-not-found') {
        setLoginErrors(prev => ({
          ...prev,
          email: 'No account found with this email. Please sign up first.'
        }));
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
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to ClipForge! A verification email has been sent to your inbox.',
      });
      navigate(from, { replace: true });
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
        setEmailValidationStatus('invalid');
        setSignupErrors(prev => ({
          ...prev,
          email: 'This email is already registered. Please sign in with your password or use Google.'
        }));
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

      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error: any) {
      // Check if it's a provider conflict error
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Extract email from error or show generic message
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ClipForge</span>
          </Link>
        </div>
      </nav>

      {/* Login/Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp
                ? 'Sign up to start creating amazing content'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Conflict Alert (MongoDB Atlas Style) */}
            {providerConflict && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">{providerConflict.message}</p>
                  {providerConflict.suggestedProvider === 'google' ? (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                    >
                      <Chrome className="mr-2 h-3 w-3" />
                      Sign in with Google
                    </Button>
                  ) : (
                    <p className="text-xs mt-1">
                      Please use the email and password form below to sign in.
                    </p>
                  )}
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
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
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
                  <label htmlFor="signup-email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => handleSignupEmailChange(e.target.value)}
                      disabled={loading}
                      className={`pl-10 ${
                        emailValidationStatus === 'valid'
                          ? 'pr-10 border-green-500 focus:border-green-500'
                          : emailValidationStatus === 'invalid'
                          ? 'pr-10 border-red-500 focus:border-red-500'
                          : 'pr-10'
                      }`}
                    />
                    {emailValidationStatus === 'valid' && (
                      <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {emailValidationStatus === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {emailValidationStatus === 'valid' && !signupErrors.email && (
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
                    setSignupErrors(prev => ({ ...prev, password: '' }));
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
                  <label htmlFor="signup-confirm-password" className="text-sm font-medium">
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
                        if (value && signupPassword && value !== signupPassword) {
                          setSignupErrors(prev => ({ ...prev, confirmPassword: "Passwords don't match" }));
                        } else {
                          setSignupErrors(prev => ({ ...prev, confirmPassword: '' }));
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
                    emailValidationStatus === 'invalid'
                  }
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>

                {/* Helper text when button is disabled */}
                {!loading && (isPasswordBreached || signupPassword.length < 8 || signupPassword !== signupConfirmPassword) && signupPassword && (
                  <p className="text-xs text-center text-muted-foreground">
                    {isPasswordBreached && '⚠️ Cannot create account with breached password'}
                    {!isPasswordBreached && signupPassword.length < 8 && '⚠️ Password must be at least 8 characters'}
                    {!isPasswordBreached && signupPassword.length >= 8 && signupPassword !== signupConfirmPassword && '⚠️ Passwords must match'}
                  </p>
                )}
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginErrors(prev => ({ ...prev, email: '' }));
                      }}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
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
                        setLoginErrors(prev => ({ ...prev, password: '' }));
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
                            : 'Too many attempts'}
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
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
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

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
            {isSignUp && (
              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy.
                We do not accept temporary or disposable email addresses.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
