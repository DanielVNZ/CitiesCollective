'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function TurnstileScriptLoader() {
  useEffect(() => {
    // Check if Turnstile is already loaded
    if (typeof window !== 'undefined' && window.turnstile) {
      window.dispatchEvent(new CustomEvent('turnstile-loaded'));
    }
  }, []);

  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      async
      defer
      strategy="afterInteractive"
      onLoad={() => {
        // Dispatch event when Turnstile loads
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('turnstile-loaded'));
        }
      }}
    />
  );
} 