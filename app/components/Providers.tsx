'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

type Props = {
  children: React.ReactNode;
  session?: Session | null;
};

export default function Providers({ children, session }: Props): React.ReactElement {
  const Provider = SessionProvider as any;
  return (
    <Provider session={session}>
      {children}
    </Provider>
  );
} 