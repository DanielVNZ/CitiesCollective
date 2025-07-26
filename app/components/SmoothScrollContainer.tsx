'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { smoothScroll } from '../utils/mobile-touch-feedback';

interface SmoothScrollContainerProps {
  children: ReactNode;
  className?: string;
  enableMomentumScrolling?: boolean;
  friction?: number;
  maxVelocity?: number;
  onScrollEnd?: () => void;
  scrollEndDelay?: number;
}

export function SmoothScrollContainer({
  children,
  className = '',
  enableMomentumScrolling = true,
  friction = 0.95,
  maxVelocity = 50,
  onScrollEnd,
  scrollEndDelay = 150,
}: SmoothScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTouchY = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrame: number;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      lastTouchY.current = touch.clientY;
      velocity.current = 0;
      
      // Cancel any ongoing momentum scrolling
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        isScrolling = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!enableMomentumScrolling) return;
      
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = lastTouchY.current - currentY;
      const deltaTime = Date.now() - touchStartTime.current;
      
      // Calculate velocity
      if (deltaTime > 0) {
        velocity.current = deltaY / deltaTime * 16; // Convert to pixels per frame (60fps)
      }
      
      lastTouchY.current = currentY;
    };

    const handleTouchEnd = () => {
      if (!enableMomentumScrolling || Math.abs(velocity.current) < 1) return;

      // Start momentum scrolling
      isScrolling = true;
      let currentVelocity = Math.min(Math.abs(velocity.current), maxVelocity) * Math.sign(velocity.current);

      const animate = () => {
        if (!isScrolling || Math.abs(currentVelocity) < 0.1) {
          isScrolling = false;
          return;
        }

        container.scrollTop += currentVelocity;
        currentVelocity *= friction;

        animationFrame = requestAnimationFrame(animate);
      };

      animate();
    };

    const handleScroll = () => {
      if (onScrollEnd) {
        smoothScroll.onScrollEnd(onScrollEnd, scrollEndDelay);
      }
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', handleScroll);
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [enableMomentumScrolling, friction, maxVelocity, onScrollEnd, scrollEndDelay]);

  return (
    <div
      ref={containerRef}
      className={`
        overflow-auto
        -webkit-overflow-scrolling: touch
        ${className}
      `}
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      }}
    >
      {children}
    </div>
  );
}