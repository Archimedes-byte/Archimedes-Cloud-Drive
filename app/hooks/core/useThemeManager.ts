import { useCallback, useEffect, useState } from 'react';
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener, 
  getAllThemes,
  getThemesByCategory,
  ThemeStyle
} from '@/app/components/ui/themes';
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
  applyTheme: (themeId: string) => boolean;
  /** 获取所有可用主题 */
  getAllThemes: typeof getAllThemes;
  /** 按分类获取主题 */
  getThemesByCategory: typeof getThemesByCategory;
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
 * 从服务器获取用户当前主题
 * @returns 主题ID或null
 */
const fetchUserTheme = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/user/theme');
    if (!response.ok) {
      console.warn('无法获取用户主题设置:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.theme : null;
  } catch (error) {
    console.error('获取用户主题失败:', error);
    return null;
  }
};

/**
 * 保存用户主题到服务器
 * @param themeId 主题ID
 * @returns 是否成功
 */
const saveUserTheme = async (themeId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/user/theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: themeId }),
    });
    
    if (!response.ok) {
      console.warn('无法保存用户主题设置:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('保存用户主题失败:', error);
    return false;
  }
};

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
  const { data: session, status } = useSession();
  
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
  }, [session, status, userTheme]);
  
  // 初始化主题 - 在组件挂载和session状态变化时执行
  useEffect(() => {
    const initTheme = async () => {
      setIsLoading(true);
      
      try {
        // 主题优先级:
        // 1. API获取的用户主题 (已登录用户)
        // 2. 传入的用户主题 (由父组件提供)
        // 3. localStorage中的主题 (临时保存)
        // 4. 默认主题
        
        let themeToApply = defaultTheme;
        
        // 检查用户是否已登录
        if (status === 'authenticated' && session?.user) {
          // 尝试从API获取用户主题
          const apiTheme = await loadUserThemeFromAPI();
          if (apiTheme) {
            themeToApply = apiTheme;
            console.log('使用API获取的用户主题:', apiTheme);
          } else if (userTheme) {
            // 如果API没有返回主题，使用传入的用户主题
            themeToApply = userTheme;
            console.log('使用传入的用户主题:', userTheme);
          } else {
            // 尝试从localStorage获取
            const storedTheme = loadThemeFromStorage();
            if (storedTheme) {
              themeToApply = storedTheme;
              console.log('使用本地存储的主题:', storedTheme);
              // 可选：将localStorage中的主题同步到服务器
              saveUserTheme(storedTheme).catch(console.error);
            }
          }
        } else if (status === 'unauthenticated') {
          // 用户未登录，尝试使用localStorage中的主题
          const storedTheme = loadThemeFromStorage();
          if (storedTheme) {
            themeToApply = storedTheme;
            console.log('未登录用户，使用本地存储的主题:', storedTheme);
          }
        }
        
        // 应用主题并更新状态
        const appliedThemeStyle = applyThemeService(themeToApply);
        
        if (appliedThemeStyle) {
          setCurrentTheme(themeToApply);
          setThemeStyle(appliedThemeStyle);
          
          // 保存到localStorage作为临时存储
          if (typeof window !== 'undefined') {
            localStorage.setItem('user-theme', themeToApply);
          }
        }
      } catch (error) {
        console.error('主题初始化错误:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initTheme();
  }, [status, session, userTheme, defaultTheme, loadUserThemeFromAPI]);
  
  // 添加主题变更事件监听（仅用于同步状态，不再触发新的主题应用）
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, styles) => {
      console.log('接收到主题变更事件，同步主题状态:', themeId);
      // 更新本地状态
      setCurrentTheme(themeId);
      setThemeStyle(styles);
    });
    
    // 组件卸载时移除事件监听
    return () => {
      removeListener();
    };
  }, []);
  
  /**
   * 设置主题方法（本地）
   * 仅应用到UI和localStorage，不同步到服务器
   */
  const setTheme = useCallback((themeId: string) => {
    try {
      // 应用主题
      const styles = applyThemeService(themeId);
      
      if (styles) {
        // 更新本地状态
        setCurrentTheme(themeId);
        setThemeStyle(styles);
      }
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-theme', themeId);
      }
      
      return true;
    } catch (error) {
      console.error('设置主题失败:', error);
      return false;
    }
  }, []);
  
  /**
   * 更新主题（服务器同步）
   * 应用到UI并同步到服务器
   */
  const updateTheme = useCallback(async (themeId: string) => {
    try {
      // 先应用主题到UI
      const success = setTheme(themeId);
      
      if (!success) {
        return false;
      }
      
      // 如果用户已登录，同步到服务器
      if (status === 'authenticated' && session?.user) {
        try {
          // 使用自定义API同步主题
          const apiSuccess = await saveUserTheme(themeId);
          if (!apiSuccess) {
            console.warn('通过API更新用户主题失败，但UI已更新');
          }
        } catch (error) {
          console.warn('保存主题到API失败，但UI已更新:', error);
        }
      }
      
      // 如果有额外的保存回调，也执行
      if (saveToServer) {
        try {
          await saveToServer(themeId).catch(error => {
            console.warn('通过回调保存主题失败，但UI已更新:', error);
          });
        } catch (error) {
          console.warn('回调保存主题失败，但UI已更新:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    }
  }, [saveToServer, setTheme, status, session]);
  
  return {
    // 主题状态
    currentTheme,
    themeStyle,
    isLoading,
    
    // 主题操作
    updateTheme,
    applyTheme: setTheme,
    
    // 主题工具
    getAllThemes,
    getThemesByCategory
  };
};

export default useThemeManager; 