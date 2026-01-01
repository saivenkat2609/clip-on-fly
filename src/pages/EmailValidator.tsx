import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mail, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import {
  validateEmail,  // HIGH PRIORITY FIX #11: Removed Gmail-only restriction
  isDisposableEmail,
  getEmailDomain,
  hasEmailAlias,
  normalizeEmail,
  hasThrowawayPattern
} from '@/lib/emailValidator';

export default function EmailValidator() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{
    checked: boolean;
    isValid: boolean;
    error?: string;
    domain?: string;
    isDisposable?: boolean;
    hasAlias?: boolean;
    normalizedEmail?: string;
    hasThrowaway?: boolean;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setResult({
        checked: true,
        isValid: false,
        error: 'Please enter an email address',
      });
      return;
    }

    // HIGH PRIORITY FIX #11: Validate all email providers, not just Gmail
    const validation = validateEmail(email);
    const domain = getEmailDomain(email);
    const disposable = isDisposableEmail(email);
    const hasAlias = hasEmailAlias(email);
    const normalized = normalizeEmail(email);
    const throwaway = hasThrowawayPattern(email);

    setResult({
      checked: true,
      isValid: validation.isValid,
      error: validation.error,
      domain,
      isDisposable: disposable,
      hasAlias,
      normalizedEmail: normalized,
      hasThrowaway: throwaway,
    });
  };

  const handleReset = () => {
    setEmail('');
    setResult(null);
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
            <span className="text-xl font-bold">NebulaAI</span>
          </Link>
        </div>
      </nav>

      {/* Email Validator */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-large">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Email Validator
            </CardTitle>
            <CardDescription className="text-center">
              Test our strict email validation - Only Gmail addresses (@gmail.com) are accepted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Enter Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 gradient-primary">
                  Validate Email
                </Button>
                {result && (
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                )}
              </div>
            </form>

            {/* Results Box */}
            {result && result.checked && (
              <Card className={`border-2 ${
                result.isValid
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20'
              }`}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Main Status */}
                    <div className="flex items-start gap-3">
                      {result.isValid ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          result.isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          {result.isValid ? 'Valid Email' : 'Invalid Email'}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          result.isValid ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                        }`}>
                          {result.isValid
                            ? 'This email address is valid and can be used for registration.'
                            : result.error || 'This email address cannot be used.'}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    {result.domain && (
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Domain:</span>
                          <span className="text-muted-foreground">{result.domain}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Type:</span>
                          {result.isDisposable ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              Disposable/Temporary Email
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Permanent Email Provider
                            </span>
                          )}
                        </div>

                        {/* Show if email has alias */}
                        {result.hasAlias && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">Alias Detected:</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              Uses + addressing
                            </span>
                          </div>
                        )}

                        {/* Show throwaway pattern detection */}
                        {result.hasThrowaway && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">Pattern:</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              Throwaway/Burner Pattern
                            </span>
                          </div>
                        )}

                        {/* Show normalized email if different */}
                        {result.normalizedEmail && result.normalizedEmail !== email.toLowerCase().trim() && (
                          <div className="flex items-center gap-2 text-sm">
                            <Info className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Normalized:</span>
                            <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                              {result.normalizedEmail}
                            </span>
                          </div>
                        )}

                        {/* Error explanations */}
                        {result.isDisposable && (
                          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
                            <p className="text-sm text-red-700 dark:text-red-400">
                              <strong>Why is this blocked?</strong> We don't accept temporary or disposable
                              email addresses to prevent abuse and ensure you can access your account in the future.
                            </p>
                          </div>
                        )}

                        {result.hasAlias && (
                          <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-3">
                            <p className="text-sm text-orange-700 dark:text-orange-400">
                              <strong>Email Alias Detected!</strong> This email uses + addressing (e.g., user+alias@domain.com).
                              We block aliases to prevent users from creating multiple accounts with the same email.
                              The normalized version shows what we'd store in our database.
                            </p>
                          </div>
                        )}

                        {result.hasThrowaway && (
                          <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-3">
                            <p className="text-sm text-orange-700 dark:text-orange-400">
                              <strong>Suspicious Pattern!</strong> This email matches patterns commonly used for
                              throwaway or burner accounts (e.g., random characters, test/temp prefixes, excessive numbers).
                            </p>
                          </div>
                        )}

                        {result.isValid && !result.isDisposable && !result.hasAlias && !result.hasThrowaway && (
                          <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                            <p className="text-sm text-green-700 dark:text-green-400">
                              <strong>Great choice!</strong> This email passed all strict validation checks.
                              You can use this email to create an account.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Examples */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3 text-sm">Try These Examples:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">john.doe@gmail.com</span>
                    <span className="text-green-600 text-xs font-medium">✓ Valid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">user+alias@gmail.com</span>
                    <span className="text-red-600 text-xs font-medium">✗ Blocked (Alias)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">test123456@gmail.com</span>
                    <span className="text-red-600 text-xs font-medium">✗ Throwaway Pattern</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">user@outlook.com</span>
                    <span className="text-red-600 text-xs font-medium">✗ Not Gmail</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">test@tempmail.com</span>
                    <span className="text-red-600 text-xs font-medium">✗ Not Gmail</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">user@yahoo.com</span>
                    <span className="text-red-600 text-xs font-medium">✗ Not Gmail</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Our <strong>ultra-strict validation</strong> ensures maximum security:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✅ <strong>Only Gmail addresses</strong> (@gmail.com) accepted</li>
                <li>❌ <strong>No email aliases</strong> (+ addressing blocked)</li>
                <li>❌ <strong>No throwaway patterns</strong> (test123, temp, etc.)</li>
                <li>❌ <strong>No other email providers</strong> (Outlook, Yahoo, etc.)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                This prevents multi-account abuse and ensures only verified Gmail users can sign up.
              </p>
              <div className="mt-4">
                <Link to="/login">
                  <Button variant="outline">Go to Sign Up</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
