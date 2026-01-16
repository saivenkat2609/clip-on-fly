import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, AlertCircle, Chrome, Info } from 'lucide-react';
import { validateEmail } from '@/lib/emailValidator';  // HIGH PRIORITY FIX #11: Removed Gmail-only restriction

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'not-found' | 'google-account' | 'generic' | null>(null);

  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);

    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' && error.shouldShowSignup) {
        setErrorType('not-found');
        setError('No account found with this email address.');
      } else if (error.code === 'auth/no-password-account' && error.provider === 'google') {
        setErrorType('google-account');
        setError('This account uses Google sign-in and does not have a password.');
      } else if (error.message) {
        setErrorType('generic');
        setError(error.message);
      } else {
        setErrorType('generic');
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
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
            <span className="text-xl font-bold">Clip on Fly</span>
          </Link>
        </div>
      </nav>

      {/* Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailSent ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-2">Password reset email sent!</p>
                  <p className="text-xs">
                    Check your email inbox for a link to reset your password.
                    The link will expire in 1 hour.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>

                  {/* Error Display */}
                  {error && (
                    <>
                      {errorType === 'not-found' && (
                        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                            <p className="font-medium mb-2">{error}</p>
                            <p className="text-xs mb-3">
                              Would you like to create a new account with this email?
                            </p>
                            <Link to="/login?signup=true">
                              <Button variant="outline" size="sm">
                                Sign Up
                              </Button>
                            </Link>
                          </AlertDescription>
                        </Alert>
                      )}

                      {errorType === 'google-account' && (
                        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-2">{error}</p>
                            <p className="text-xs mb-3">
                              Your account is managed through Google. Please sign in with Google.
                            </p>
                            <Link to="/login">
                              <Button variant="outline" size="sm">
                                <Chrome className="mr-2 h-3 w-3" />
                                Go to Sign In
                              </Button>
                            </Link>
                          </AlertDescription>
                        </Alert>
                      )}

                      {errorType === 'generic' && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
            {emailSent && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
