import { useCallback, useEffect } from 'react';
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener, 
  getAllThemes,
  getThemesByCategory,
  useTheme
} from '@/app/shared/themes';
import { useUserProfile } from './useUserProfile';

/**
 * 文件管理系统主题管理Hook
 * 整合用户资料主题与主题系统
 */
export const useThemeManager = () => {
  const { userProfile, updateTheme: updateUserProfileTheme } = useUserProfile();
  const { currentTheme, themeStyle, setTheme, isLoading } = useTheme();
  
  // 从用户资料或本地存储中应用主题
  useEffect(() => {
    // 应用主题优先级：
    // 1. userProfile中的主题
    // 2. localStorage中的主题
    // 3. 默认主题
    if (userProfile && userProfile.theme) {
      console.log('从用户资料应用主题:', userProfile.theme);
      applyThemeService(userProfile.theme);
    } else {
      const cachedTheme = loadThemeFromStorage();
      if (cachedTheme) {
        console.log('从localStorage恢复主题:', cachedTheme);
        applyThemeService(cachedTheme);
      } else {
        console.log('应用默认主题');
        applyThemeService('default');
      }
    }
  }, [userProfile]);
  
  // 添加主题变更事件监听
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, themeStyle) => {
      console.log('接收到主题变更事件，应用新主题:', themeId);
      applyThemeService(themeId);
    });
    
    // 组件卸载时移除事件监听
    return () => {
      removeListener();
    };
  }, []);
  
  // 更新主题，同时更新用户资料
  const updateTheme = useCallback(async (themeId: string) => {
    try {
      // 先应用主题到UI
      setTheme(themeId);
      
      // 然后更新用户资料
      if (userProfile) {
        await updateUserProfileTheme(themeId);
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    }
  }, [userProfile, updateUserProfileTheme, setTheme]);
  
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