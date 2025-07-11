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

  useEffect(() => {
    // Check if we're on localhost and disable if so
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      setShouldRender(false);
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
            callback: (token: string) => {
              console.log('Turnstile verified:', token);
              onVerify?.(token);
            },
            'expired-callback': () => {
              console.log('Turnstile expired');
            },
            'error-callback': () => {
              console.log('Turnstile error');
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

  // Don't render anything if we're on localhost
  if (!shouldRender) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="turnstile-widget-container"></div>
    </div>
  );
} 