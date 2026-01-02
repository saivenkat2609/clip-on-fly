import { User } from 'firebase/auth';

/**
 * Get user initials from display name or email
 */
export function getUserInitials(user: User | null): string {
  if (!user) return "??";

  if (user.displayName) {
    const names = user.displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.displayName.substring(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }

  return "U";
}

/**
 * Get user's first name from display name
 */
export function getFirstName(user: User | null): string {
  if (!user?.displayName) return "";
  return user.displayName.split(" ")[0];
}

/**
 * Get user's last name from display name
 */
export function getLastName(user: User | null): string {
  if (!user?.displayName) return "";
  const names = user.displayName.split(" ");
  return names.length > 1 ? names[names.length - 1] : "";
}

/**
 * Get user's display name or fallback to email
 */
export function getDisplayName(user: User | null): string {
  if (!user) return "User";
  return user.displayName || user.email || "User";
}

/**
 * Get user's authentication providers (handles both old and new format)
 * Old format: provider (string)
 * New format: providers (array)
 */
export function getUserProviders(userData: any): ('password' | 'google')[] {
  // New format with providers array
  if (userData.providers && Array.isArray(userData.providers)) {
    return userData.providers;
  }

  // Old format with single provider
  if (userData.provider) {
    return [userData.provider];
  }

  // Fallback
  return [];
}

/**
 * Check if user has linked multiple authentication providers
 */
export function hasLinkedProviders(userData: any): boolean {
  const providers = getUserProviders(userData);
  return providers.length > 1;
}
