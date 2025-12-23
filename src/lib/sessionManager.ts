/**
 * Session Management
 * Handles session persistence, timeouts, and sensitive action re-authentication
 */

import { auth } from './firebase';
import {
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { googleProvider } from './firebase';

// Session timeout for sensitive actions (30 minutes)
const SENSITIVE_ACTION_TIMEOUT = 30 * 60 * 1000;

// Inactivity timeout (30 minutes)
export const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Warning before auto-logout (5 minutes)
export const INACTIVITY_WARNING_TIME = 5 * 60 * 1000;

/**
 * Set session persistence based on "Remember Me" checkbox
 */
export async function setSessionPersistence(rememberMe: boolean): Promise<void> {
  const persistence = rememberMe
    ? browserLocalPersistence  // Persist for 7 days
    : browserSessionPersistence; // Clear on browser close

  await setPersistence(auth, persistence);
}

/**
 * Check if user has recently authenticated
 */
export function hasRecentAuth(): boolean {
  const user = auth.currentUser;
  if (!user || !user.metadata.lastSignInTime) return false;

  const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
  const now = Date.now();

  return (now - lastSignIn) < SENSITIVE_ACTION_TIMEOUT;
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
async function requestReauth(action: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    // Determine provider
    const providerId = user.providerData[0]?.providerId;

    if (providerId === 'password') {
      // Password re-authentication
      const password = await promptForPassword(action);
      if (!password) return false;

      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } else if (providerId === 'google.com') {
      // Google re-authentication
      await reauthenticateWithPopup(user, googleProvider);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Re-authentication failed:', error);
    return false;
  }
}

/**
 * Prompt user for password (should be implemented with a modal)
 * This is a placeholder - actual implementation should use a React modal
 */
async function promptForPassword(action: string): Promise<string | null> {
  // In real implementation, this would show a modal dialog
  // For now, we'll return null to indicate cancellation
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
