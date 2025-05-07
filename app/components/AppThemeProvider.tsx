import { ReactNode, useEffect } from 'react';
import { useThemeManager } from '@/app/hooks/core/useThemeManager';
import { useSession } from 'next-auth/react';
import { reinitCustomThemes, syncCustomThemesForUser } from '@/app/theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

/**
 * 应用主题提供器
 * 管理应用全局主题，自动从数据库获取用户主题
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  
  // 使用钩子初始化和管理主题
  const themeManager = useThemeManager({
    defaultTheme: 'default'
  });
  
  // 当用户登录后，确保加载用户特定主题
  useEffect(() => {
    const loadUserTheme = async () => {
      if (status === 'authenticated' && userId) {
        console.log('用户已登录，开始加载用户特定主题...');
        
        // 1. 同步用户自定义主题，确保自定义主题在刷新后能正确加载
        syncCustomThemesForUser(userId, themeManager.currentTheme);
        
        // 2. 立即从API加载用户主题
        try {
          // 先尝试从API获取主题
          const response = await fetch('/api/user/theme');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.theme) {
              console.log('AppThemeProvider: 从API获取到用户主题:', data.theme);
              
              // 如果是自定义主题，确保它已经在本地存在
              if (data.theme.startsWith('custom_')) {
                // 再次同步，确保自定义主题存在
                syncCustomThemesForUser(userId, data.theme);
              }
              
              // 使用从API获取的主题ID
              await themeManager.updateTheme(data.theme);
              return;
            }
          }
          
          // 如果API没有返回主题，则应用默认主题
          console.log('AppThemeProvider: API未返回主题，应用默认主题');
          await themeManager.updateTheme('default');
        } catch (error) {
          console.error('AppThemeProvider: 加载用户主题出错:', error);
          // 出错时也应用默认主题
          themeManager.updateTheme('default').catch(console.error);
        }
      }
    };
    
    loadUserTheme();
  }, [status, userId, themeManager]);
  
  return <>{children}</>;
} 