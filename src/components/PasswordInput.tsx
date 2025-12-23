/**
 * Enhanced Password Input with Strength Meter
 * Shows real-time feedback on password strength and security
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validatePasswordStrength,
  validatePasswordStrengthWithZxcvbn,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordStrength
} from '@/lib/passwordValidator';
import { checkPasswordBreached } from '@/lib/passwordBreachChecker';

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrengthMeter?: boolean;
  checkBreaches?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  onBreachStatusChange?: (isBreached: boolean) => void;
  onStrengthChange?: (strength: PasswordStrength | null) => void;
}

export function PasswordInput({
  label = 'Password',
  value,
  onChange,
  placeholder = 'Enter your password',
  showStrengthMeter = false,
  checkBreaches = false,
  error,
  className,
  required = false,
  autoComplete = 'current-password',
  onBreachStatusChange,
  onStrengthChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [isBreached, setIsBreached] = useState(false);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [useZxcvbn, setUseZxcvbn] = useState(false);

  // Check if zxcvbn is available
  useEffect(() => {
    import('zxcvbn')
      .then(() => setUseZxcvbn(true))
      .catch(() => setUseZxcvbn(false));
  }, []);

  // Calculate password strength
  useEffect(() => {
    if (!showStrengthMeter || !value) {
      setStrength(null);
      if (onStrengthChange) onStrengthChange(null);
      return;
    }

    const calculateStrength = async () => {
      if (useZxcvbn) {
        const result = await validatePasswordStrengthWithZxcvbn(value);
        setStrength(result);
        if (onStrengthChange) onStrengthChange(result);
      } else {
        const result = validatePasswordStrength(value);
        setStrength(result);
        if (onStrengthChange) onStrengthChange(result);
      }
    };

    calculateStrength();
  }, [value, showStrengthMeter, useZxcvbn, onStrengthChange]);

  // Check for breaches (debounced)
  useEffect(() => {
    if (!checkBreaches || !value || value.length < 8) {
      setIsBreached(false);
      if (onBreachStatusChange) onBreachStatusChange(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingBreach(true);
      const breached = await checkPasswordBreached(value);
      setIsBreached(breached);
      if (onBreachStatusChange) onBreachStatusChange(breached);
      setCheckingBreach(false);
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [value, checkBreaches, onBreachStatusChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label htmlFor="password" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Input with show/hide button */}
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            isBreached && 'border-yellow-500'
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Breach warning */}
      {isBreached && !error && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Password found in data breach
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              This password has been exposed in a data breach. Please choose a different, unique password.
            </p>
          </div>
        </div>
      )}

      {/* Password strength meter */}
      {showStrengthMeter && value && strength && !error && !isBreached && (
        <div className="space-y-2">
          {/* Strength bars */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i <= strength.score
                    ? getPasswordStrengthColor(strength.score)
                    : 'bg-gray-200'
                )}
              />
            ))}
          </div>

          {/* Strength label and crack time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {strength.score >= 3 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : strength.score >= 2 ? (
                <Shield className="h-4 w-4 text-yellow-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                'text-sm font-medium',
                strength.score >= 3 ? 'text-green-700' :
                strength.score >= 2 ? 'text-yellow-700' :
                'text-red-700'
              )}>
                {getPasswordStrengthLabel(strength.score)}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Crack time: {strength.crackTime}
            </span>
          </div>

          {/* Warning */}
          {strength.warning && (
            <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{strength.warning}</span>
            </div>
          )}

          {/* Feedback suggestions */}
          {strength.feedback.length > 0 && strength.score < 3 && (
            <div className="space-y-1">
              {strength.feedback.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-gray-400">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Checking breach status */}
          {checkBreaches && checkingBreach && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full" />
              Checking for data breaches...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
