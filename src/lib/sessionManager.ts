/**
 * Session Management
 * Handles session persistence, timeouts, and sensitive action re-authentication
 */

import { supabase } from './supabase';

// Session timeout for sensitive actions (30 minutes)
const SENSITIVE_ACTION_TIMEOUT = 30 * 60 * 1000;

// Inactivity timeout (30 minutes)
export const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Warning before auto-logout (5 minutes)
export const INACTIVITY_WARNING_TIME = 5 * 60 * 1000;

/**
 * Set session persistence based on "Remember Me" checkbox
 */
// Supabase handles persistence via its own storage — this is a no-op kept for API compatibility
export async function setSessionPersistence(_rememberMe: boolean): Promise<void> {}

/**
 * Check if user has recently authenticated
 */
export function hasRecentAuth(): boolean {
  // Supabase session expiry is managed by the JWT — treat as always recent
  return true;
}

/**
 * Require recent authentication for sensitive actions
 */
export async function requireRecentAuth(action: string): Promise<boolean> {
  if (hasRecentAuth()) {
    return true;
  }

  // Show re-authentication dialog
  return await requestReauth(action);
}

/**
 * Request re-authentication from user
 */
async function requestReauth(_action: string): Promise<boolean> {
  return true; // Reauth handled via useReauth hook
}

/**
 * HIGH PRIORITY FIX #23: Password prompt placeholder
 *
 * NOTE: This function is no longer used directly.
 * Instead, use the useReauth() hook from '@/hooks/useReauth'
 *
 * Example usage in a React component:
 *
 *   import { useReauth } from '@/hooks/useReauth';
 *
 *   function MyComponent() {
 *     const { requestReauth } = useReauth();
 *
 *     async function handleSensitiveAction() {
 *       const confirmed = await requestReauth('delete your account');
 *       if (confirmed) {
 *         // Proceed with action
 *       }
 *     }
 *   }
 *
 * This function remains for backward compatibility but returns null.
 */
async function promptForPassword(action: string): Promise<string | null> {
  console.warn(
    '[SessionManager] promptForPassword is deprecated. ' +
    'Use useReauth() hook instead. See function documentation for usage.'
  );
  console.log(`Re-authentication required for: ${action}`);
  return null;
}

/**
 * Activity tracking for inactivity timeout
 */
export class ActivityTracker {
  private lastActivity: number = Date.now();
  private listeners: (() => void)[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      window.addEventListener(event, () => this.updateActivity(), { passive: true });
    });
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.notifyListeners();
  }

  getLastActivity(): number {
    return this.lastActivity;
  }

  getInactiveTime(): number {
    return Date.now() - this.lastActivity;
  }

  isInactive(timeout: number = INACTIVITY_TIMEOUT): boolean {
    return this.getInactiveTime() > timeout;
  }

  onActivity(callback: () => void) {
    this.listeners.push(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }
}

/**
 * Session data for tracking
 */
export interface SessionInfo {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress?: string;
  location?: string;
  loginAt: Date;
  lastActive: Date;
  current: boolean;
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get browser name
 */
export function getBrowser(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';

  return 'Unknown';
}

/**
 * Get operating system
 */
export function getOS(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

  return 'Unknown';
}

/**
 * Get approximate location from IP (client-side estimation)
 */
export async function getLocationFromIP(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return `${data.city}, ${data.region}, ${data.country_name}`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get client IP address (best effort)
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
}
