'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the floating action button to avoid SSR issues
const DynamicFloatingActionButton = dynamic(
  () => import('./FloatingActionButton'),
  { 
    ssr: false,
    loading: () => null
  }
);

interface ClientComponentsProps {
  cityId: number;
}

export function ClientComponents({ cityId }: ClientComponentsProps) {
  return (
    <Suspense fallback={null}>
      <DynamicFloatingActionButton cityId={cityId} />
    </Suspense>
  );
} 