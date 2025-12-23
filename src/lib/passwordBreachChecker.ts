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

    if (!response.ok) {
      console.error('Failed to check password breach status');
      return false; // Fail open - don't block user if API is down
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
    return false; // Fail open - don't block user on error
  }
}

/**
 * Check password with detailed information
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

    if (!response.ok) {
      return {
        isBreached: false,
        error: 'Could not verify password breach status'
      };
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
    return {
      isBreached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
