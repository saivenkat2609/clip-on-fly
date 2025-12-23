/**
 * Password Validation and Strength Checking
 * Uses zxcvbn for accurate password strength assessment
 */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=terrible, 4=excellent
  feedback: string[];
  warning?: string;
  passed: boolean;
  crackTime: string;
}

// Common passwords list (top 100 most common)
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'iloveyou', '1234567890', '1q2w3e4r',
  'sunshine', 'princess', 'adobe123', '123321', 'solo', 'monkey', 'lovely', 'monkey',
  'letmein', 'login', 'admin', 'welcome', 'admin123', 'password1', 'password123',
  'test', 'test123', 'demo', 'demo123', 'temp', 'temp123', 'guest', 'guest123',
  'user', 'user123', 'root', 'root123', 'master', 'master123'
]);

// Keyboard patterns
const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
  '1234567890', 'abcdefgh', 'qazwsx', 'qweasd', 'zaq12wsx'
];

/**
 * Check if password contains keyboard patterns
 */
function hasKeyboardPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern =>
    lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
  );
}

/**
 * Check if password is a common password
 */
function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * Estimate crack time based on score
 */
function estimateCrackTime(score: number): string {
  const times = [
    'Instant',
    'Seconds',
    'Minutes',
    'Hours',
    'Days to Years'
  ];
  return times[score] || 'Unknown';
}

/**
 * Validate password strength (without zxcvbn for now)
 * This will be enhanced once zxcvbn is imported
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  let warning: string | undefined;

  // Length check
  if (password.length >= 16) {
    score += 1.5;
  } else if (password.length >= 12) {
    score += 1;
  } else if (password.length >= 8) {
    score += 0.5;
  } else {
    feedback.push('Use at least 8 characters (12+ recommended)');
    warning = 'Password is too short';
  }

  // Character variety checks
  if (/[A-Z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add uppercase letters (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add lowercase letters (a-z)');
  }

  if (/\d/.test(password)) {
    score += 0.5;
  } else {
    feedback.push('Add numbers (0-9)');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add symbols (!@#$%^&*)');
  }

  // Entropy bonus for mixed character types
  const charTypes = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;

  if (charTypes >= 4) {
    score += 0.5;
  }

  // Penalties
  if (isCommonPassword(password)) {
    score = 0;
    warning = 'This is a commonly used password';
    feedback.push('Choose a unique password');
  }

  if (hasKeyboardPattern(password)) {
    score = Math.max(0, score - 1);
    warning = warning || 'Contains keyboard pattern';
    feedback.push('Avoid keyboard patterns (e.g., qwerty)');
  }

  // Repeated characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 0.5);
    feedback.push('Avoid repeated characters (e.g., aaa, 111)');
  }

  // Sequential numbers or letters
  if (/012|123|234|345|456|567|678|789|abc|bcd|cde|def/i.test(password)) {
    score = Math.max(0, score - 0.5);
    feedback.push('Avoid sequential characters (e.g., 123, abc)');
  }

  // Final score (0-4)
  const finalScore = Math.max(0, Math.min(4, Math.floor(score)));

  return {
    score: finalScore as 0 | 1 | 2 | 3 | 4,
    feedback,
    warning,
    passed: finalScore >= 3,
    crackTime: estimateCrackTime(finalScore)
  };
}

/**
 * Enhanced validation with zxcvbn (call this after zxcvbn is loaded)
 */
export async function validatePasswordStrengthWithZxcvbn(password: string): Promise<PasswordStrength> {
  try {
    // Dynamic import to avoid bundle size issues
    const zxcvbn = await import('zxcvbn');
    const result = zxcvbn.default(password);

    return {
      score: result.score as 0 | 1 | 2 | 3 | 4,
      feedback: [
        ...(result.feedback.warning ? [result.feedback.warning] : []),
        ...result.feedback.suggestions
      ],
      warning: result.feedback.warning,
      passed: result.score >= 3,
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
    };
  } catch (error) {
    // Fallback to basic validation if zxcvbn fails
    return validatePasswordStrength(password);
  }
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: 0 | 1 | 2 | 3 | 4): string {
  const colors = [
    'bg-red-500',     // 0: Terrible
    'bg-orange-500',  // 1: Weak
    'bg-yellow-500',  // 2: Fair
    'bg-lime-500',    // 3: Good
    'bg-green-500'    // 4: Strong
  ];
  return colors[score];
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: 0 | 1 | 2 | 3 | 4): string {
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  return labels[score];
}
