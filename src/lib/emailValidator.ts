import { disposableEmailDomains, suspiciousPatterns } from './disposableEmailDomains';

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

export interface StrictValidationOptions {
  blockAliases?: boolean; // Block + addressing (user+alias@domain.com)
  blockDotVariations?: boolean; // Block dot variations for Gmail (john.doe vs johndoe)
}

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Extracts domain from email address
 */
export function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Checks if email domain is from a disposable email service
 */
export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email);

  if (!domain) return false;

  // Check against known disposable domains
  if (disposableEmailDomains.has(domain)) {
    return true;
  }

  // Check for common subdomain patterns (e.g., xyz.tempmail.com)
  const domainParts = domain.split('.');
  if (domainParts.length > 2) {
    const parentDomain = domainParts.slice(-2).join('.');
    if (disposableEmailDomains.has(parentDomain)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if email matches suspicious patterns
 */
export function hasSuspiciousPattern(email: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(email));
}

/**
 * Checks if the domain is a well-known free email provider (allowed)
 */
export function isKnownProvider(email: string): boolean {
  const domain = getEmailDomain(email);
  const knownProviders = new Set([
    'gmail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.co.in',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'protonmail.com',
    'proton.me',
    'zoho.com',
    'mail.com',
    'gmx.com',
    'gmx.net',
    'yandex.com',
    'yandex.ru',
  ]);

  return knownProviders.has(domain);
}

/**
 * Checks if email uses plus addressing (alias)
 * Example: user+anything@gmail.com
 */
export function hasEmailAlias(email: string): boolean {
  const [localPart] = email.split('@');
  return localPart.includes('+');
}

/**
 * Normalizes email address to prevent alias abuse
 * - Removes plus addressing (user+alias@domain.com -> user@domain.com)
 * - Removes dots from Gmail addresses (jo.hn@gmail.com -> john@gmail.com)
 * - Converts to lowercase
 */
export function normalizeEmail(email: string): string {
  email = email.toLowerCase().trim();

  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return email;
  }

  let normalizedLocal = localPart;

  // Remove everything after + (plus addressing)
  if (normalizedLocal.includes('+')) {
    normalizedLocal = normalizedLocal.split('+')[0];
  }

  // For Gmail and Google Workspace emails, remove dots from local part
  // Gmail ignores dots: john.doe@gmail.com = johndoe@gmail.com
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalizedLocal = normalizedLocal.replace(/\./g, '');
  }

  return `${normalizedLocal}@${domain}`;
}

/**
 * Checks if email is likely a throwaway/burner variation
 * Detects ONLY very obvious patterns - not aggressive like other validators
 * This follows how major sites (Google, Facebook, GitHub, Stripe) validate emails
 */
export function hasThrowawayPattern(email: string): boolean {
  const [localPart] = email.toLowerCase().split('@');

  // Only check for VERY obvious throwaway patterns
  // DO NOT flag legitimate patterns like "john123" or "user2024"
  const obviousThrowawayPatterns = [
    /^test\d*$/,                      // test, test123, test1 (ONLY if it's just "test" + digits)
    /^temp\d*$/,                      // temp, temp123, temp1
    /^throwaway/,                     // throwaway, throwawayjohn
    /^burner/,                        // burner, burneremail
    /^fake/,                          // fake, fakeemail
    /^spam/,                          // spam, spamemail
    /^trash/,                         // trash, trashemail
    /^junk/,                          // junk, junkemail
    /^noreply/,                       // noreply
    /^no-reply/,                      // no-reply
    /^\d{8,}$/,                       // 8+ digits ONLY (like 12345678) - legitimate users have letters
    /^[a-z]{25,}$/,                   // 25+ random letters ONLY - suspiciously long
    /^(.)\1{6,}/,                     // 7+ repeated characters (aaaaaaa) - clearly fake
    /^asdf+$/,                        // asdf, asdfasdf - keyboard mashing
    /^qwer+$/,                        // qwerty patterns
  ];

  return obviousThrowawayPatterns.some(pattern => pattern.test(localPart));
}

/**
 * Comprehensive email validation with strict anti-abuse checks
 * Returns validation result with specific error messages
 */
export function validateEmail(
  email: string,
  options: StrictValidationOptions = { blockAliases: true, blockDotVariations: false }
): EmailValidationResult {
  // Trim whitespace
  email = email.trim();

  // Check if empty
  if (!email) {
    return {
      isValid: false,
      error: 'Email address is required',
    };
  }

  // Check format
  if (!isValidEmailFormat(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  // STRICT CHECK: Block plus addressing (email aliases)
  if (options.blockAliases && hasEmailAlias(email)) {
    return {
      isValid: false,
      error: 'Email aliases (using +) are not allowed. Please use your primary email address without any aliases.',
    };
  }

  // Get normalized email for additional checks
  const normalizedEmail = normalizeEmail(email);

  // Check for disposable email
  if (isDisposableEmail(email)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.',
    };
  }

  // STRICT CHECK: Detect throwaway/burner patterns
  if (hasThrowawayPattern(email)) {
    return {
      isValid: false,
      error: 'This email appears to be a temporary or throwaway address. Please use a legitimate permanent email.',
    };
  }

  // Check for suspicious patterns (only if not a known provider)
  if (!isKnownProvider(email) && hasSuspiciousPattern(email)) {
    return {
      isValid: false,
      error: 'This email address appears to be invalid. Please use a legitimate email address.',
    };
  }

  // All checks passed
  return {
    isValid: true,
    normalizedEmail,
  };
}

/**
 * STRICT validation for manual sign-up - ONLY accepts @gmail.com
 * Follows validation patterns used by major websites (GitHub, Stripe, Facebook)
 * - Only blocks known disposable domains (Gmail will never be in this list)
 * - Trusts Gmail as a legitimate provider
 * - Only blocks VERY obvious throwaway patterns
 */
export function validateEmailStrictGmailOnly(email: string): EmailValidationResult {
  // Trim whitespace
  email = email.trim();

  // Check if empty
  if (!email) {
    return {
      isValid: false,
      error: 'Email address is required',
    };
  }

  // Check format
  if (!isValidEmailFormat(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  // STRICT: Only allow @gmail.com or @googlemail.com
  const domain = getEmailDomain(email);
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      isValid: false,
      error: 'Only Gmail addresses (@gmail.com) are allowed. Please use a valid Gmail account.',
    };
  }

  // Block plus addressing (email aliases) if needed
  // Note: This is optional - many sites allow this
  if (hasEmailAlias(email)) {
    return {
      isValid: false,
      error: 'Email aliases (using +) are not allowed. Please use your primary Gmail address without any aliases.',
    };
  }

  // For Gmail, we trust Google's validation
  // Skip throwaway pattern check since Gmail is a trusted provider
  // Gmail users legitimately have patterns like "john123@gmail.com" or "user2024@gmail.com"

  // Gmail is never in the disposable domains list, so this will always pass
  // But we keep it for consistency and safety
  if (isDisposableEmail(email)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email addresses are not allowed.',
    };
  }

  const normalizedEmail = normalizeEmail(email);

  // All checks passed - Gmail is a trusted provider
  return {
    isValid: true,
    normalizedEmail,
  };
}

/**
 * Validates Gmail specifically for OAuth (lenient - Google already verified)
 * Only checks domain, no strict anti-abuse checks for OAuth
 */
export function validateGmailOAuth(email: string): EmailValidationResult {
  const domain = getEmailDomain(email);

  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      isValid: false,
      error: 'Only Gmail accounts are allowed for Google sign-in',
    };
  }

  // For OAuth, Google has already verified the email
  // No need for additional strict checks
  const normalizedEmail = normalizeEmail(email);

  return {
    isValid: true,
    normalizedEmail,
  };
}
