import React from 'react';
import { ThemeProvider } from '@/app/theme';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';

interface RootProvidersProps {
  children: React.ReactNode;
  session?: SessionProviderProps['session'];
}

export default function RootProviders({ children, session }: RootProvidersProps) {
  const NextAuthProvider = SessionProvider as any;
  
  return (
    <NextAuthProvider session={session}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NextAuthProvider>
  );
} 