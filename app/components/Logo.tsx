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
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          Cities Collective
        </div>
      </Link>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark 
    ? '/logo/default-monochrome-white.svg' 
    : '/logo/default-monochrome-black.svg';

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image 
        src={logoSrc} 
        alt="Cities Collective" 
        height={height}
        width={height * 6.9} // Approximate aspect ratio
        className="h-auto"
      />
    </Link>
  );
} 