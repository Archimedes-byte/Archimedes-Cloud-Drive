import { useCallback, useEffect, useState } from 'react';
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener, 
  getAllThemes,
  getThemesByCategory,
  ThemeStyle
} from '@/app/components/ui/themes';

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
  
  // 从用户资料或本地存储中应用主题
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // 应用主题优先级：
      // 1. 用户主题（从props传入）- 如果登录用户有主题设置
      // 2. 默认主题 - 新用户或未设置主题的用户
      // 不再使用localStorage中的主题，防止继承上一个用户的主题设置
      let themeToApply = defaultTheme;
      
      if (userTheme) {
        console.log('从用户资料应用主题:', userTheme);
        themeToApply = userTheme;
      } else {
        // 清除本地存储的主题，避免新用户继承前一个用户的主题
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-theme');
        }
        console.log('新用户或未设置主题的用户，应用默认主题:', defaultTheme);
      }
      
      // 应用主题并更新状态
      const appliedThemeStyle = applyThemeService(themeToApply);
      
      if (appliedThemeStyle) {
        setCurrentTheme(themeToApply);
        setThemeStyle(appliedThemeStyle);
      }
    } catch (error) {
      console.error('主题初始化错误:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userTheme, defaultTheme]);
  
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
      
      // 如果有服务器同步功能，则同步到服务器
      if (saveToServer) {
        try {
          // 如果服务器更新失败，仍然保持UI更新
          await saveToServer(themeId).catch(error => {
            console.warn('无法更新服务器上的主题设置，但UI已更新:', error);
          });
        } catch (error) {
          console.warn('更新服务器主题失败，但UI已更新:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    }
  }, [saveToServer, setTheme]);
  
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