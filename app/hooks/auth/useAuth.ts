'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // 退出登录
  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    logout
  };
}; 