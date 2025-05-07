 /**
 * 主题钩子
 * 提供主题状态管理和UI控制功能
 */
import { useCallback, useEffect, useState } from 'react';
import { ThemeStyle } from '@/app/types/theme';
import { useSession } from 'next-auth/react';
import { 
  applyTheme as applyThemeService,
  loadThemeFromStorage, 
  addThemeChangeListener,
  getAllThemes as getAllThemesOriginal,
  getThemesByCategory,
  getThemeStyle,
  reinitCustomThemes,
  syncCustomThemesForUser
} from '@/app/theme/theme-service';

/**
 * 主题Hook接口
 */
export interface ThemeHook {
  /** 当前主题ID */
  currentTheme: string | null;
  /** 当前主题样式对象 */
  themeStyle: ThemeStyle | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 更新主题（同步到用户设置） */
  updateTheme: (themeId: string) => Promise<boolean>;
  /** 应用主题（仅本地应用） */
  applyTheme: (themeId: string) => boolean;
  /** 获取所有可用主题 */
  getAllThemes: () => Array<{id: string, name: string, category: string}>;
  /** 按分类获取主题 */
  getThemesByCategory: typeof getThemesByCategory;
  /** 用户会话状态 */
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  /** 是否已同步到服务器 */
  isSyncedToServer: boolean;
  
  // UI状态控制
  /** 主题面板是否显示 */
  showThemePanel: boolean;
  /** 设置主题面板显示状态 */
  setShowThemePanel: (show: boolean) => void;
  /** 切换主题面板显示状态 */
  toggleThemePanel: () => void;
  /** 打开主题面板 */
  openThemePanel: () => void;
  /** 关闭主题面板 */
  closeThemePanel: () => void;
}

/**
 * 主题Hook参数
 */
export interface UseThemeProps {
  /** 默认应用主题 */
  defaultTheme?: string;
  /** 当前用户的主题 */
  userTheme?: string | null;
  /** 是否禁用API同步 */
  disableApiSync?: boolean;
}

/**
 * 主题钩子
 * 提供主题状态管理和UI控制功能
 * 
 * @param props 配置参数
 * @returns 主题管理接口
 */
export function useTheme({
  defaultTheme = 'default',
  userTheme = null,
  disableApiSync = false
}: UseThemeProps = {}): ThemeHook {
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncedToServer, setIsSyncedToServer] = useState(false);
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  
  // 主题面板UI状态
  const [showThemePanel, setShowThemePanel] = useState(false);
  
  /**
   * 从API获取用户主题
   */
  const fetchUserTheme = useCallback(async (): Promise<string | null> => {
    if (!session?.user || disableApiSync) return null;
    
    try {
      const response = await fetch('/api/user/theme');
      
      if (!response.ok) {
        throw new Error('获取用户主题设置失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.theme) {
        return data.theme;
      }
      
      return null;
    } catch (error) {
      console.error('useTheme: 获取用户主题出错:', error);
      return null;
    }
  }, [session, disableApiSync]);
  
  /**
   * 保存主题到用户配置
   */
  const saveUserTheme = useCallback(async (themeId: string): Promise<boolean> => {
    if (!session?.user || disableApiSync) {
      return false;
    }
    
    try {
      const response = await fetch('/api/user/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ themeId }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新主题配置失败');
      }
      
      setIsSyncedToServer(true);
      return true;
    } catch (error) {
      console.error('useTheme: 保存主题到用户配置失败:', error);
      setIsSyncedToServer(false);
      return false;
    }
  }, [session, disableApiSync]);
  
  // 从API加载用户主题
  const loadUserThemeFromAPI = useCallback(async () => {
    if (status === 'authenticated' && session?.user) {
      const apiTheme = disableApiSync ? null : await fetchUserTheme();
      
      if (apiTheme) {
        // 同步自定义主题
        if (apiTheme.startsWith('custom_') && userId) {
          reinitCustomThemes(userId);
          syncCustomThemesForUser(userId, apiTheme);
        }
        return apiTheme;
      } else if (userTheme) {
        return userTheme;
      } else {
        // 尝试从localStorage获取
        const storedTheme = loadThemeFromStorage();
        if (storedTheme) {
          if (!disableApiSync) {
            saveUserTheme(storedTheme).catch(console.error);
          }
          return storedTheme;
        }
      }
    } else if (status === 'unauthenticated') {
      // 未登录用户使用localStorage
      const storedTheme = loadThemeFromStorage();
      if (storedTheme) {
        return storedTheme;
      }
    }
    return defaultTheme;
  }, [session, status, userTheme, fetchUserTheme, saveUserTheme, userId, defaultTheme, disableApiSync]);
  
  // 初始化主题
  useEffect(() => {
    const initTheme = async () => {
      setIsLoading(true);
      
      try {
        if (userId) {
          reinitCustomThemes(userId);
        }
        
        const themeId = await loadUserThemeFromAPI();
        
        if (!themeId) {
          handleThemeApplication(defaultTheme);
          return;
        }
        
        handleThemeApplication(themeId);
      } catch (error) {
        console.error('useTheme: 初始化主题失败:', error);
        handleThemeApplication(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };
    
    initTheme();
  }, [status, loadUserThemeFromAPI, userId, defaultTheme]);
  
  // 处理主题应用的通用逻辑
  const handleThemeApplication = useCallback((themeId: string) => {
    try {
      // 应用主题，传入用户ID
      const result = applyThemeService(themeId, true, userId);
      
      if (result) {
        setCurrentTheme(themeId);
        setThemeStyle(result);
        
        // 确保文档body上有正确的data-theme属性
        if (typeof document !== 'undefined') {
          document.body.dataset.theme = themeId;
        }
      } else {
        // 如果应用失败，使用默认主题
        const defaultResult = applyThemeService(defaultTheme, true, userId);
        
        if (defaultResult) {
          setCurrentTheme(defaultTheme);
          setThemeStyle(defaultResult);
          
          // 确保文档body上有正确的data-theme属性
          if (typeof document !== 'undefined') {
            document.body.dataset.theme = defaultTheme;
          }
        }
      }
    } catch (error) {
      console.error('useTheme: 应用主题失败:', error);
      setCurrentTheme(defaultTheme);
    }
  }, [userId, defaultTheme]);
  
  // 监听主题变更事件
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, style) => {
      setCurrentTheme(themeId);
      setThemeStyle(style);
      
      // 确保文档body上有正确的data-theme属性
      if (typeof document !== 'undefined') {
        document.body.dataset.theme = themeId;
      }
    });
    
    return () => {
      removeListener();
    };
  }, []);
  
  /**
   * 更新主题并同步到用户设置
   */
  const updateTheme = useCallback(async (themeId: string): Promise<boolean> => {
    // 应用主题
    const result = applyThemeService(themeId, true, userId);
    
    if (!result) {
      return false;
    }
    
    // 如果已登录，保存到用户设置
    if (status === 'authenticated' && session?.user && !disableApiSync) {
      return await saveUserTheme(themeId);
    }
    
    return true;
  }, [status, session, saveUserTheme, userId, disableApiSync]);
  
  /**
   * 仅应用主题（不同步到服务器）
   */
  const applyThemeLocal = useCallback((themeId: string): boolean => {
    const result = applyThemeService(themeId, true, userId);
    return !!result;
  }, [userId]);
  
  /**
   * 切换主题面板显示状态
   */
  const toggleThemePanel = useCallback(() => {
    setShowThemePanel(prev => !prev);
  }, []);
  
  /**
   * 打开主题面板
   */
  const openThemePanel = useCallback(() => {
    setShowThemePanel(true);
  }, []);
  
  /**
   * 关闭主题面板
   */
  const closeThemePanel = useCallback(() => {
    setShowThemePanel(false);
  }, []);
  
  return {
    // 主题状态
    currentTheme,
    themeStyle,
    isLoading,
    applyTheme: applyThemeLocal,
    updateTheme,
    getAllThemes: getAllThemesOriginal,
    getThemesByCategory,
    sessionStatus: status,
    isSyncedToServer,
    
    // UI状态
    showThemePanel,
    setShowThemePanel,
    toggleThemePanel,
    openThemePanel,
    closeThemePanel,
  };
} 