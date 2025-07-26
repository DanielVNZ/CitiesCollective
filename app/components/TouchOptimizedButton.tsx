'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { useTouchFeedback, TouchFeedbackOptions } from '../utils/mobile-touch-feedback';

interface TouchOptimizedButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  feedback?: TouchFeedbackOptions;
  minTouchTarget?: number;
  preventDoubleClick?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

export function TouchOptimizedButton({
  children,
  onClick,
  className = '',
  disabled = false,
  feedback = { haptic: true, visual: true },
  minTouchTarget = 44,
  preventDoubleClick = true,
  type = 'button',
  ariaLabel,
}: TouchOptimizedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { provideFeedback } = useTouchFeedback();
  const lastClickTime = useRef(0);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Ensure minimum touch target size
    const rect = button.getBoundingClientRect();
    if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
      button.style.minWidth = `${minTouchTarget}px`;
      button.style.minHeight = `${minTouchTarget}px`;
    }
  }, [minTouchTarget]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Prevent double clicks if enabled
    if (preventDoubleClick) {
      const now = Date.now();
      if (now - lastClickTime.current < 300) {
        return;
      }
      lastClickTime.current = now;
    }

    // Provide touch feedback
    if (buttonRef.current && feedback) {
      provideFeedback(buttonRef.current, feedback);
    }

    // Execute click handler
    onClick?.(e);
  };

  const handleTouchStart = () => {
    if (disabled || !buttonRef.current) return;
    
    // Add pressed state
    buttonRef.current.style.transform = 'scale(0.95)';
    buttonRef.current.style.opacity = '0.8';
  };

  const handleTouchEnd = () => {
    if (disabled || !buttonRef.current) return;
    
    // Remove pressed state
    buttonRef.current.style.transform = 'scale(1)';
    buttonRef.current.style.opacity = '1';
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        touch-optimized
        transition-all duration-100 ease-out
        flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        minWidth: `${minTouchTarget}px`,
        minHeight: `${minTouchTarget}px`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}