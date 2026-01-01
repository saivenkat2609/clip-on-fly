/**
 * Currency Detection Utility
 * Auto-detects user's preferred currency based on location and locale
 */

import type { Currency } from './pricing';

// Countries that primarily use INR
const INR_COUNTRIES = ['IN', 'BD', 'LK', 'NP', 'BT', 'MV'];

// Countries that primarily use USD
const USD_COUNTRIES = ['US', 'CA', 'AU', 'NZ', 'SG', 'HK', 'AE', 'SA', 'QA'];

/**
 * Detect user's preferred currency based on IP location
 * Falls back to browser locale if IP detection fails
 */
export async function detectUserCurrency(): Promise<Currency> {
  try {
    // Try to detect from IP using ipapi.co (free tier: 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/');

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    const countryCode = data.country_code;

    // Check if user is from India or neighboring countries
    if (INR_COUNTRIES.includes(countryCode)) {
      return 'INR';
    }

    // Check if user is from USD-primary countries
    if (USD_COUNTRIES.includes(countryCode)) {
      return 'USD';
    }

    // For European countries, we'll use USD (could add EUR support later)
    return 'USD';
  } catch (error) {
    console.warn('Failed to detect currency from IP, falling back to locale', error);

    // Fallback to browser locale
    return detectCurrencyFromLocale();
  }
}

/**
 * Detect currency from browser locale
 */
function detectCurrencyFromLocale(): Currency {
  const locale = navigator.language || 'en-US';

  // Check for Indian locales
  if (locale.startsWith('en-IN') || locale.startsWith('hi') || locale.startsWith('bn')) {
    return 'INR';
  }

  // Default to USD for all other locales
  return 'USD';
}

/**
 * Get currency from localStorage (user's saved preference)
 * Returns null if no preference is saved
 */
export function getSavedCurrency(): Currency | null {
  try {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved === 'INR' || saved === 'USD') {
      return saved;
    }
    return null;
  } catch (error) {
    console.warn('Failed to read saved currency preference', error);
    return null;
  }
}

/**
 * Save currency preference to localStorage
 */
export function saveCurrencyPreference(currency: Currency): void {
  try {
    localStorage.setItem('preferredCurrency', currency);
  } catch (error) {
    console.warn('Failed to save currency preference', error);
  }
}

/**
 * Get user's currency (checks saved preference first, then auto-detects)
 */
export async function getUserCurrency(): Promise<Currency> {
  // Check if user has a saved preference
  const saved = getSavedCurrency();
  if (saved) {
    return saved;
  }

  // Auto-detect based on location
  const detected = await detectUserCurrency();

  // Save the detected currency for future use
  saveCurrencyPreference(detected);

  return detected;
}
