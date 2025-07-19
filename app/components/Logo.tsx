'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
}

export function Logo({ className = '', height = 40, showText = true }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark 
    ? '/logo/default-monochrome-white.svg' 
    : '/logo/default-monochrome-black.svg';

  return (
    <Link href="/" className={`flex items-center ${className} relative`}>
      {/* Text fallback - always visible */}
      <div className={`text-2xl font-bold text-gray-900 dark:text-white transition-opacity duration-200 ${
        imageLoaded ? 'opacity-0' : 'opacity-100'
      }`}>
        Cities Collective
      </div>
      
      {/* Logo image - positioned absolutely over the text */}
      {mounted && (
        <Image 
          src={logoSrc} 
          alt="Cities Collective" 
          height={height}
          width={height * 6.9} // Approximate aspect ratio
          className={`h-auto w-auto absolute left-0 transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </Link>
  );
} 