import { useState, useEffect, useCallback } from 'react';
import { 
  applyTheme, 
  getThemeStyle, 
  loadThemeFromStorage, 
  THEME_CHANGE_EVENT,
  addThemeChangeListener,
  THEME_STORAGE_KEY
} from './theme-service';
import { ThemeStyle } from './theme-definitions';

/**
 * 主题钩子选项
 */
interface UseThemeOptions {
  // 是否在挂载时应用主题
  applyOnMount?: boolean;
  // 是否保存主题到localStorage
  saveToStorage?: boolean;
  // 初始主题ID
  initialTheme?: string;
  // 当主题更改后的回调
  onThemeChange?: (themeId: string, themeStyle: ThemeStyle) => void;
}

/**
 * 主题钩子返回值
 */
interface UseThemeReturn {
  // 当前主题ID
  currentTheme: string;
  // 当前主题样式
  themeStyle: ThemeStyle;
  // 设置主题的函数
  setTheme: (themeId: string) => void;
  // 判断是否正在加载
  isLoading: boolean;
}

/**
 * React钩子: 管理主题
 * @param options 主题钩子选项
 * @returns 主题控制对象
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const {
    applyOnMount = true,
    saveToStorage = true,
    initialTheme,
    onThemeChange,
  } = options;

  // 初始化主题状态
  const [currentTheme, setCurrentTheme] = useState<string>(
    initialTheme || loadThemeFromStorage() || 'default'
  );
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(
    getThemeStyle(currentTheme)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 设置主题函数
  const setTheme = useCallback((themeId: string) => {
    setIsLoading(true);
    
    try {
      // 应用主题到DOM
      applyTheme(themeId, true);
      
      // 更新状态
      setCurrentTheme(themeId);
      setThemeStyle(getThemeStyle(themeId));
      
      // 保存主题到localStorage，如果saveToStorage为true
      if (saveToStorage && typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        console.log(`主题 ${themeId} 已保存到本地存储`);
      }
      
      // 调用回调
      if (onThemeChange) {
        onThemeChange(themeId, getThemeStyle(themeId));
      }
    } catch (error) {
      console.error('应用主题失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onThemeChange, saveToStorage]);

  // 监听外部主题变更
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, style) => {
      setCurrentTheme(themeId);
      setThemeStyle(style);
      
      // 调用回调
      if (onThemeChange) {
        onThemeChange(themeId, style);
      }
    });
    
    return () => removeListener();
  }, [onThemeChange]);

  // 初始加载时应用主题
  useEffect(() => {
    if (applyOnMount) {
      const savedTheme = loadThemeFromStorage();
      
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (initialTheme) {
        setTheme(initialTheme);
      } else {
        setTheme('default');
      }
    }
  }, [applyOnMount, initialTheme, setTheme]);

  return {
    currentTheme,
    themeStyle,
    setTheme,
    isLoading
  };
} 