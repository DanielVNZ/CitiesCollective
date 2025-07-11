'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  theme?: 'light' | 'dark';
  onVerify?: (token: string) => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({ siteKey, theme = 'light', onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [shouldRender, setShouldRender] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Check if we're on localhost and disable if so
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      setShouldRender(false);
      // Provide a dummy token for localhost to pass validation
      const dummyToken = 'localhost-development-token';
      setToken(dummyToken);
      onVerify?.(dummyToken);
      return;
    }

    const renderTurnstile = () => {
      if (typeof window !== 'undefined' && window.turnstile && containerRef.current) {
        try {
          // Clear any existing content
          containerRef.current.innerHTML = '';
          
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: theme,
            callback: (verificationToken: string) => {
              console.log('Turnstile verified:', verificationToken);
              setToken(verificationToken);
              onVerify?.(verificationToken);
            },
            'expired-callback': () => {
              console.log('Turnstile expired');
              setToken('');
            },
            'error-callback': () => {
              console.log('Turnstile error');
              setToken('');
            }
          });
        } catch (error) {
          console.error('Error rendering Turnstile:', error);
        }
      }
    };

    // Try to render immediately if turnstile is already loaded
    if (typeof window !== 'undefined' && window.turnstile) {
      renderTurnstile();
    } else {
      // Wait for turnstile to load
      const checkTurnstile = () => {
        if (typeof window !== 'undefined' && window.turnstile) {
          renderTurnstile();
        } else {
          setTimeout(checkTurnstile, 100);
        }
      };
      checkTurnstile();
    }

    // Cleanup function
    return () => {
      if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Error resetting Turnstile:', error);
        }
      }
    };
  }, [siteKey, theme, onVerify]);

  // Don't render the widget on localhost, but still provide the hidden input
  if (!shouldRender) {
    return (
      <input 
        type="hidden" 
        name="cf-turnstile-response" 
        value={token} 
      />
    );
  }

  return (
    <>
      <div className="flex justify-center">
        <div ref={containerRef} className="turnstile-widget-container"></div>
      </div>
      <input 
        type="hidden" 
        name="cf-turnstile-response" 
        value={token} 
        required 
      />
    </>
  );
} 