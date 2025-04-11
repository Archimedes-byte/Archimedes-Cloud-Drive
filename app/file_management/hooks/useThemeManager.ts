import { useCallback, useEffect, useState } from 'react';
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener, 
  getAllThemes,
  getThemesByCategory,
  ThemeStyle
} from '@/app/shared/themes';
import { useAppUserProfile } from './useAppUserProfile';

/**
 * 文件管理系统主题管理Hook
 * 整合用户资料主题与主题系统
 */
export const useThemeManager = () => {
  const { userProfile, updateUserProfile } = useAppUserProfile();
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 从用户资料或本地存储中应用主题
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // 应用主题优先级：
      // 1. userProfile中的主题
      // 2. localStorage中的主题
      // 3. 默认主题
      let themeToApply = 'default';
      
      if (userProfile && userProfile.theme) {
        console.log('从用户资料应用主题:', userProfile.theme);
        themeToApply = userProfile.theme;
      } else {
        const cachedTheme = loadThemeFromStorage();
        if (cachedTheme) {
          console.log('从localStorage恢复主题:', cachedTheme);
          themeToApply = cachedTheme;
        } else {
          console.log('应用默认主题');
        }
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
  }, [userProfile]);
  
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
  
  // 设置主题方法
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
  
  // 更新主题，同时更新用户资料
  const updateTheme = useCallback(async (themeId: string) => {
    try {
      // 先应用主题到UI
      const success = setTheme(themeId);
      
      if (!success) {
        return false;
      }
      
      // 检查是否能够安全地更新用户资料
      if (userProfile && updateUserProfile) {
        try {
          // 如果服务器更新失败，仍然保持UI更新
          await updateUserProfile(themeId).catch(error => {
            console.warn('无法更新服务器上的主题设置，但UI已更新:', error);
          });
        } catch (error) {
          console.warn('更新用户资料主题失败，但UI已更新:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    }
  }, [userProfile, updateUserProfile, setTheme]);
  
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