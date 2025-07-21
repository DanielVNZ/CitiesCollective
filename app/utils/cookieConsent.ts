export type CookieConsentType = 'all' | 'necessary' | null;

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
}

export function getCookieConsent(): CookieConsentType {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cookie-consent') as CookieConsentType;
}

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('cookie-preferences');
    if (stored) {
      return JSON.parse(stored) as CookiePreferences;
    }
  } catch (error) {
    console.error('Error parsing cookie preferences from localStorage:', error);
  }
  return null;
}

export async function getCookieConsentFromDB(): Promise<CookieConsentType> {
  try {
    const response = await fetch('/api/user/cookie-consent');
    if (response.ok) {
      const data = await response.json();
      return data.consent;
    }
  } catch (error) {
    console.error('Error fetching cookie consent from DB:', error);
  }
  return null;
}

export async function getCookiePreferencesFromDB(): Promise<CookiePreferences | null> {
  try {
    const response = await fetch('/api/user/cookie-consent');
    if (response.ok) {
      const data = await response.json();
      return data.preferences;
    } else {
      console.error('Error fetching cookie preferences from DB:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching cookie preferences from DB:', error);
  }
  return null;
}

export async function updateCookieConsentInDB(consent: CookieConsentType): Promise<void> {
  try {
    await fetch('/api/user/cookie-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ consent }),
    });
  } catch (error) {
    console.error('Error updating cookie consent in DB:', error);
  }
}

export async function updateCookiePreferencesInDB(preferences: CookiePreferences): Promise<void> {
  try {
    const response = await fetch('/api/user/cookie-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });
    
    if (!response.ok) {
      console.error('Error updating cookie preferences in DB:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error updating cookie preferences in DB:', error);
  }
}

export function hasAnalyticsConsent(): boolean {
  // First check individual preferences
  const preferences = getCookiePreferences();
  if (preferences && preferences.analytics) {
    return true;
  }
  
  // Fallback to legacy consent check
  const consent = getCookieConsent();
  return consent === 'all';
}

export function hasNecessaryConsent(): boolean {
  // First check individual preferences
  const preferences = getCookiePreferences();
  if (preferences && preferences.necessary) {
    return true;
  }
  
  // Fallback to legacy consent check
  const consent = getCookieConsent();
  // If no consent is stored, allow necessary functionality (default behavior)
  return consent === 'all' || consent === 'necessary' || consent === null;
}

export function loadCloudflareInsights(): void {
  if (!hasAnalyticsConsent()) return;
  
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_INSIGHTS_TOKEN;
  if (!token) return;
  
  // Load Cloudflare Web Analytics
  const script = document.createElement('script');
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  script.defer = true;
  document.head.appendChild(script);
}

export function loadCloudflareTurnstile(): void {
  // Turnstile is necessary for security, so load it regardless of consent
  // Check if Turnstile is already loaded
  if (typeof window !== 'undefined' && window.turnstile) return;
  
  // Load Cloudflare Turnstile
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function updateCookieConsent(consent: CookieConsentType): void {
  if (typeof window === 'undefined') return;
  
  if (consent) {
    localStorage.setItem('cookie-consent', consent);
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    // If user accepts all cookies, load analytics
    if (consent === 'all') {
      loadCloudflareInsights();
    }
    
    // Load Turnstile regardless of consent (it's necessary for security)
    loadCloudflareTurnstile();
  }
}

export function updateCookiePreferences(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
  localStorage.setItem('cookie-consent-date', new Date().toISOString());
  
  // Determine consent level and update legacy consent
  let consentLevel: CookieConsentType = 'necessary';
  if (preferences.analytics || preferences.performance || preferences.marketing) {
    consentLevel = 'all';
  }
  
  localStorage.setItem('cookie-consent', consentLevel);
  
  // If user accepts analytics, load Cloudflare Insights
  if (preferences.analytics) {
    loadCloudflareInsights();
  }
  
  // Load Turnstile regardless of consent (it's necessary for security)
  loadCloudflareTurnstile();
}

export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('cookie-consent');
  localStorage.removeItem('cookie-consent-date');
  localStorage.removeItem('cookie-preferences');
  
  // Dispatch a custom event to notify components that consent was cleared
  window.dispatchEvent(new CustomEvent('cookieConsentCleared'));
}

export async function clearCookieConsentForLoggedInUser(): Promise<void> {
  try {
    await fetch('/api/user/cookie-consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ consent: null }),
    });
  } catch (error) {
    console.error('Error clearing cookie consent in DB:', error);
  }
} 