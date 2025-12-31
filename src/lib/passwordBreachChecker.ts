/**
 * Password Breach Detection using HaveIBeenPwned API
 * Uses k-Anonymity model - only sends first 5 chars of SHA-1 hash
 * No passwords are sent to the API
 */

/**
 * Convert string to SHA-1 hash
 */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Check if password has been found in data breaches
 * Returns true if password is compromised
 *
 * HIGH PRIORITY FIX #12: Changed to fail-closed for better security
 * Throws error if breach check fails, preventing potentially compromised passwords
 */
export async function checkPasswordBreached(password: string): Promise<boolean> {
  try {
    // Generate SHA-1 hash of password
    const hashHex = await sha1(password);

    // Use k-Anonymity: only send first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true' // Security best practice
      }
    });

    // HIGH PRIORITY FIX #12: Fail closed - throw error if API check fails
    if (!response.ok) {
      console.error('Failed to check password breach status:', response.status);
      throw new Error('Unable to verify password security at this time. Please try again in a moment.');
    }

    const hashes = await response.text();

    // Check if our suffix appears in the results
    const lines = hashes.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        console.log(`Password found in ${count.trim()} breaches`);
        return true;
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    console.error('Error checking password breach:', error);
    // HIGH PRIORITY FIX #12: Fail closed - throw error instead of allowing compromised password
    if (error instanceof Error && error.message.includes('Unable to verify password security')) {
      throw error; // Re-throw our custom error message
    }
    throw new Error('Unable to verify password security. Please check your internet connection and try again.');
  }
}

/**
 * Check password with detailed information
 *
 * HIGH PRIORITY FIX #12: Changed to fail-closed for better security
 * Throws error if breach check fails
 */
export async function checkPasswordBreachedDetailed(password: string): Promise<{
  isBreached: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const hashHex = await sha1(password);
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true'
      }
    });

    // HIGH PRIORITY FIX #12: Fail closed - throw error if API check fails
    if (!response.ok) {
      throw new Error(`Unable to verify password security (Status: ${response.status}). Please try again.`);
    }

    const hashes = await response.text();
    const lines = hashes.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          isBreached: true,
          count: parseInt(countStr.trim(), 10)
        };
      }
    }

    return { isBreached: false };
  } catch (error) {
    // HIGH PRIORITY FIX #12: Fail closed - throw error instead of returning safe result
    throw new Error(error instanceof Error ? error.message : 'Unable to verify password security');
  }
}
