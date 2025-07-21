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

    // Function to check if Turnstile is loaded and render
    const checkAndRenderTurnstile = () => {
      if (typeof window !== 'undefined' && window.turnstile) {
        renderTurnstile();
      } else {
        // Wait a bit longer and try again
        setTimeout(checkAndRenderTurnstile, 200);
      }
    };

    // Start checking for Turnstile
    checkAndRenderTurnstile();

    // Also listen for the script load event
    const handleScriptLoad = () => {
      if (typeof window !== 'undefined' && window.turnstile) {
        renderTurnstile();
      }
    };

    // Listen for when the Turnstile script loads
    document.addEventListener('turnstile-loaded', handleScriptLoad);
    
    // Also check periodically for the first few seconds
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.turnstile) {
        renderTurnstile();
        clearInterval(interval);
      }
    }, 100);

    // Clear interval after 5 seconds to avoid infinite checking
    setTimeout(() => clearInterval(interval), 5000);

    // Cleanup function
    return () => {
      if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Error resetting Turnstile:', error);
        }
      }
      // Remove event listener
      document.removeEventListener('turnstile-loaded', handleScriptLoad);
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