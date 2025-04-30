import { useCallback, useEffect, useState } from 'react';
import { 
  applyTheme,
  loadThemeFromStorage, 
  addThemeChangeListener,
  getAllThemes as getAllThemesOriginal,
  getThemesByCategory,
  THEME_STORAGE_KEY,
  getThemeStyle
} from '@/app/theme';
import { ThemeStyle } from '@/app/theme/theme-definitions';
import { useSession } from 'next-auth/react';

/**
 * 主题管理Hook接口
 */
export interface ThemeManagerHook {
  /** 当前主题ID */
  currentTheme: string | null;
  /** 当前主题样式对象 */
  themeStyle: ThemeStyle | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 更新主题（同步到用户设置） */
  updateTheme: (themeId: string) => Promise<boolean>;
  /** 应用主题（本地应用） */
  applyTheme: (themeId: string, isDark?: boolean) => boolean;
  /** 获取所有可用主题 */
  getAllThemes: () => Array<{id: string, name: string, category: string}>;
  /** 按分类获取主题 */
  getThemesByCategory: typeof getThemesByCategory;
  /** 用户会话状态 */
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  /** 是否已同步到服务器 */
  isSyncedToServer: boolean;
}

/**
 * 主题管理Hook参数
 */
export interface UseThemeManagerProps {
  /** 保存到服务器的回调函数 */
  saveToServer?: (themeId: string) => Promise<boolean>;
  /** 默认应用主题 */
  defaultTheme?: string;
  /** 当前用户的主题 */
  userTheme?: string | null;
}

/**
 * 主题管理Hook
 * 管理应用主题设置，支持本地和远程存储
 * 
 * @param props 配置参数
 * @returns 主题管理接口
 */
export const useThemeManager = ({
  saveToServer,
  defaultTheme = 'default',
  userTheme = null
}: UseThemeManagerProps = {}): ThemeManagerHook => {
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncedToServer, setIsSyncedToServer] = useState(false);
  const { data: session, status } = useSession();
  
  /**
   * 从API获取用户主题
   * @returns 用户配置的主题或null
   */
  const fetchUserTheme = useCallback(async (): Promise<string | null> => {
    if (!session?.user) return null;
    
    try {
      console.log('从API获取用户主题设置...');
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('获取用户资料失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.profile?.theme) {
        console.log('成功从API获取到用户主题:', data.profile.theme);
        return data.profile.theme;
      }
      
      console.log('API中未找到用户主题配置');
      return null;
    } catch (error) {
      console.error('获取用户主题出错:', error);
      return null;
    }
  }, [session]);

  /**
   * 保存主题到用户配置
   * @param themeId 主题ID
   * @returns 是否保存成功
   */
  const saveUserTheme = useCallback(async (themeId: string): Promise<boolean> => {
    if (!session?.user) {
      console.log('用户未登录，跳过保存主题到服务器');
      return false;
    }
    
    try {
      console.log(`正在保存主题 ${themeId} 到用户配置...`);
      
      // 使用外部传入的保存函数，如果有的话
      if (saveToServer) {
        const result = await saveToServer(themeId);
        if (result) {
          setIsSyncedToServer(true);
          return true;
        }
      }
      
      // 使用API更新用户配置
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: themeId }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新主题配置失败');
      }
      
      console.log(`主题 ${themeId} 已成功保存到用户配置`);
      setIsSyncedToServer(true);
      return true;
    } catch (error) {
      console.error('保存主题到用户配置失败:', error);
      setIsSyncedToServer(false);
      return false;
    }
  }, [session, saveToServer]);
  
  // 从API加载用户主题
  const loadUserThemeFromAPI = useCallback(async () => {
    if (status === 'authenticated' && session?.user) {
      console.log('尝试从API获取用户主题设置');
      const apiTheme = await fetchUserTheme();
      
      if (apiTheme) {
        console.log('从API获取到用户主题:', apiTheme);
        return apiTheme;
      } else if (userTheme) {
        // 如果API没有返回主题，使用传入的用户主题
        console.log('使用传入的用户主题:', userTheme);
        return userTheme;
      } else {
        // 尝试从localStorage获取
        const storedTheme = loadThemeFromStorage();
        if (storedTheme) {
          console.log('使用本地存储的主题:', storedTheme);
          // 可选：将localStorage中的主题同步到服务器
          saveUserTheme(storedTheme).catch(console.error);
          return storedTheme;
        }
      }
    } else if (status === 'unauthenticated') {
      // 用户未登录，尝试使用localStorage中的主题
      const storedTheme = loadThemeFromStorage();
      if (storedTheme) {
        console.log('未登录用户，使用本地存储的主题:', storedTheme);
        return storedTheme;
      }
    }
    return null;
  }, [session, status, userTheme, fetchUserTheme, saveUserTheme]);
  
  // 初始化主题 - 在组件挂载和session状态变化时执行
  useEffect(() => {
    const initTheme = async () => {
      setIsLoading(true);
      
      try {
        // 尝试从API或本地存储获取主题
        const themeId = await loadUserThemeFromAPI() || defaultTheme;
        
        // 检测系统深色模式偏好
        const prefersDarkMode = typeof window !== 'undefined' && 
          window.matchMedia && 
          window.matchMedia('(prefers-color-scheme: dark)').matches;
          
        // 应用主题
        const result = applyTheme(themeId, prefersDarkMode);
        
        if (result) {
          setCurrentTheme(themeId);
          setThemeStyle(result);
          console.log(`主题 ${themeId} 已成功应用`);
        } else {
          // 如果应用失败，使用默认主题
          console.warn(`应用主题 ${themeId} 失败，使用默认主题`);
          const defaultResult = applyTheme(defaultTheme, prefersDarkMode);
          
          if (defaultResult) {
            setCurrentTheme(defaultTheme);
            setThemeStyle(defaultResult);
          }
        }
      } catch (error) {
        console.error('初始化主题失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initTheme();
  }, [status, defaultTheme, loadUserThemeFromAPI]);
  
  // 监听主题变更事件
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, style) => {
      setCurrentTheme(themeId);
      setThemeStyle(style);
    });
    
    return () => {
      removeListener();
    };
  }, []);
  
  /**
   * 更新主题 - 在本地应用并同步到服务器
   */
  const updateTheme = useCallback(async (themeId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 检测系统深色模式偏好
      const prefersDarkMode = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // 应用主题
      const result = applyTheme(themeId, prefersDarkMode);
      
      if (!result) {
        console.error(`应用主题 ${themeId} 失败`);
        return false;
      }
      
      // 更新状态
      setCurrentTheme(themeId);
      setThemeStyle(result);
      
      // 同步到本地存储
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      
      // 如果用户已登录，同步到服务器
      setIsSyncedToServer(false);
      if (status === 'authenticated') {
        await saveUserTheme(themeId);
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status, saveUserTheme]);
  
  /**
   * 应用主题 - 只在本地应用，不同步到服务器
   */
  const applyThemeLocal = useCallback((themeId: string, isDark?: boolean): boolean => {
    try {
      // 检测系统深色模式偏好(如果未提供isDark参数)
      const prefersDarkMode = isDark !== undefined ? isDark : 
        (typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      // 应用主题
      const result = applyTheme(themeId, prefersDarkMode);
      
      if (!result) {
        console.error(`应用主题 ${themeId} 失败`);
        return false;
      }
      
      // 更新状态
      setCurrentTheme(themeId);
      setThemeStyle(result);
      
      // 同步到本地存储
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      
      return true;
    } catch (error) {
      console.error('应用主题失败:', error);
      return false;
    }
  }, []);
  
  return {
    currentTheme,
    themeStyle,
    isLoading,
    updateTheme,
    applyTheme: applyThemeLocal,
    getAllThemes: () => {
      // 包装原始函数，添加category属性
      return getAllThemesOriginal().map(theme => ({
        ...theme,
        category: 'default' // 添加默认分类，如果原始数据没有
      }));
    },
    getThemesByCategory,
    sessionStatus: status,
    isSyncedToServer
  };
};

export default useThemeManager; 