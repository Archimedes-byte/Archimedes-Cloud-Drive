'use client';

import React from 'react';
import { ToastProvider } from '@/app/components/features/dashboard/Toaster';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

export default Providers; 