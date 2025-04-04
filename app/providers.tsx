'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps): React.ReactElement {
  const Provider = SessionProvider as any;
  
  return (
    <Provider session={session}>
      {children}
    </Provider>
  );
} 