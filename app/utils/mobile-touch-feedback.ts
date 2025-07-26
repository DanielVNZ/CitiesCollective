'use client';

// Mobile touch feedback and haptic utilities

export interface TouchFeedbackOptions {
  haptic?: boolean;
  visual?: boolean;
  audio?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
}

export class MobileTouchFeedback {
  private static instance: MobileTouchFeedback;
  private isSupported: boolean = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.isSupported = this.checkSupport();
    this.initializeAudio();
  }

  public static getInstance(): MobileTouchFeedback {
    if (!MobileTouchFeedback.instance) {
      MobileTouchFeedback.instance = new MobileTouchFeedback();
    }
    return MobileTouchFeedback.instance;
  }

  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'navigator' in window &&
      'vibrate' in navigator
    );
  }

  private initializeAudio() {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Haptic feedback
  public haptic(intensity: 'light' | 'medium' | 'heavy' = 'light') {
    if (!this.isSupported) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
    };

    try {
      navigator.vibrate(patterns[intensity]);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Visual feedback with ripple effect
  public visual(element: HTMLElement, options: { color?: string; duration?: number } = {}) {
    const { color = 'rgba(255, 255, 255, 0.3)', duration = 300 } = options;

    // Create ripple element
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = `ripple ${duration}ms linear`;
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '9999';

    // Position ripple
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${rect.left + rect.width / 2 - size / 2}px`;
    ripple.style.top = `${rect.top + rect.height / 2 - size / 2}px`;

    // Add to body
    document.body.appendChild(ripple);

    // Remove after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, duration);
  }

  // Audio feedback
  public audio(frequency: number = 800, duration: number = 100) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  }

  // Combined feedback
  public feedback(element: HTMLElement, options: TouchFeedbackOptions = {}) {
    const {
      haptic = true,
      visual = true,
      audio = false,
      intensity = 'light',
      duration = 300,
    } = options;

    if (haptic) {
      this.haptic(intensity);
    }

    if (visual) {
      this.visual(element, { duration });
    }

    if (audio) {
      const frequencies = { light: 600, medium: 800, heavy: 1000 };
      this.audio(frequencies[intensity], duration / 3);
    }
  }
}

// Global instance
export const touchFeedback = MobileTouchFeedback.getInstance();

// React hook for touch feedback
export function useTouchFeedback() {
  const provideFeedback = (element: HTMLElement, options?: TouchFeedbackOptions) => {
    touchFeedback.feedback(element, options);
  };

  const provideHaptic = (intensity?: 'light' | 'medium' | 'heavy') => {
    touchFeedback.haptic(intensity);
  };

  const provideVisual = (element: HTMLElement, options?: { color?: string; duration?: number }) => {
    touchFeedback.visual(element, options);
  };

  return {
    provideFeedback,
    provideHaptic,
    provideVisual,
  };
}

// Smooth scrolling utilities
export class SmoothScrollManager {
  private static instance: SmoothScrollManager;
  private isScrolling = false;
  private scrollTimeout: NodeJS.Timeout | null = null;

  public static getInstance(): SmoothScrollManager {
    if (!SmoothScrollManager.instance) {
      SmoothScrollManager.instance = new SmoothScrollManager();
    }
    return SmoothScrollManager.instance;
  }

  // Smooth scroll to element
  public scrollToElement(
    element: HTMLElement,
    options: {
      behavior?: 'smooth' | 'auto';
      block?: 'start' | 'center' | 'end' | 'nearest';
      inline?: 'start' | 'center' | 'end' | 'nearest';
      offset?: number;
    } = {}
  ) {
    const { behavior = 'smooth', block = 'start', inline = 'nearest', offset = 0 } = options;

    if (offset !== 0) {
      // Custom scroll with offset
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior,
      });
    } else {
      element.scrollIntoView({
        behavior,
        block,
        inline,
      });
    }
  }

  // Smooth scroll with momentum
  public scrollWithMomentum(
    container: HTMLElement,
    deltaY: number,
    options: {
      friction?: number;
      maxVelocity?: number;
      duration?: number;
    } = {}
  ) {
    const { friction = 0.95, maxVelocity = 50, duration = 1000 } = options;

    if (this.isScrolling) return;

    this.isScrolling = true;
    let velocity = Math.min(Math.abs(deltaY), maxVelocity) * Math.sign(deltaY);
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > duration || Math.abs(velocity) < 0.1) {
        this.isScrolling = false;
        return;
      }

      container.scrollTop += velocity;
      velocity *= friction;

      requestAnimationFrame(animate);
    };

    animate();
  }

  // Detect scroll end
  public onScrollEnd(callback: () => void, delay: number = 150) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(callback, delay);
  }
}

// Global smooth scroll instance
export const smoothScroll = SmoothScrollManager.getInstance();

// Touch-optimized button component utilities
export function createTouchOptimizedButton(
  element: HTMLElement,
  options: {
    feedback?: TouchFeedbackOptions;
    minTouchTarget?: number;
    preventDoubleClick?: boolean;
  } = {}
) {
  const { feedback, minTouchTarget = 44, preventDoubleClick = true } = options;
  
  // Ensure minimum touch target size
  const rect = element.getBoundingClientRect();
  if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
    element.style.minWidth = `${minTouchTarget}px`;
    element.style.minHeight = `${minTouchTarget}px`;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
  }

  // Add touch feedback
  let lastClickTime = 0;
  
  const handleTouch = (event: TouchEvent) => {
    if (preventDoubleClick) {
      const now = Date.now();
      if (now - lastClickTime < 300) {
        event.preventDefault();
        return;
      }
      lastClickTime = now;
    }

    if (feedback) {
      touchFeedback.feedback(element, feedback);
    }
  };

  element.addEventListener('touchstart', handleTouch, { passive: false });
  
  // Add visual touch states
  element.style.transition = 'transform 0.1s ease, opacity 0.1s ease';
  
  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.95)';
    element.style.opacity = '0.8';
  });

  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
  });

  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
  });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouch);
  };
}

// CSS injection for ripple animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}