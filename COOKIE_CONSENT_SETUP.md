# Cookie Consent Setup

This project includes a GDPR-compliant cookie consent system that integrates with Cloudflare Insights.

## Features

- **GDPR Compliant**: Respects user privacy choices
- **Two Consent Levels**: 
  - "Necessary Only" - Essential cookies only
  - "Accept All" - All cookies including analytics
- **Cloudflare Insights Integration**: Only loads analytics after consent
- **Responsive Design**: Works on all device sizes
- **Dark Mode Support**: Matches your site's theme

## Setup

### 1. Environment Variables

Add your Cloudflare Insights token to your `.env.local` file:

```bash
NEXT_PUBLIC_CLOUDFLARE_INSIGHTS_TOKEN=your_cloudflare_insights_token_here
```

### 2. How It Works

The cookie consent system:

1. **Shows on First Visit**: Appears at the bottom of the page for new visitors
2. **Remembers Choice**: Stores consent in localStorage (not a cookie, so it's privacy-friendly)
3. **Conditional Analytics**: Only loads Cloudflare Insights if user accepts "all" cookies
4. **Privacy Policy Link**: Links to your existing privacy policy

### 3. Consent Types

- **Necessary Cookies**: Session management, authentication, basic functionality
- **Analytics Cookies**: Cloudflare Insights for website analytics

### 4. Customization

You can customize the cookie consent banner by editing:
- `app/components/CookieConsent.tsx` - Banner appearance and text
- `app/utils/cookieConsent.ts` - Consent logic and analytics loading

### 5. Testing

To test the cookie consent:
1. Open browser dev tools
2. Go to Application > Local Storage
3. Delete the `cookie-consent` entry
4. Refresh the page to see the banner again

## Privacy Compliance

This implementation:
- ✅ Respects GDPR requirements
- ✅ Only loads analytics after explicit consent
- ✅ Provides clear information about cookie usage
- ✅ Links to privacy policy
- ✅ Allows granular consent (necessary vs all)

## Files Created/Modified

- `app/components/CookieConsent.tsx` - Main consent banner component
- `app/components/AnalyticsLoader.tsx` - Conditional analytics loading
- `app/utils/cookieConsent.ts` - Consent management utilities
- `app/layout.tsx` - Added components to layout 