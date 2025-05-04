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
    initialTheme || (typeof window !== 'undefined' && saveToStorage ? loadThemeFromStorage() || 'default' : 'default')
  );
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(
    getThemeStyle(currentTheme)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 设置主题函数
  const setTheme = useCallback((themeId: string) => {
    // 如果不需要应用主题，直接返回
    if (!applyOnMount) {
      return;
    }

    setIsLoading(true);
    
    try {
      // 应用主题到DOM
      applyTheme(themeId, saveToStorage);
      
      // 更新状态
      setCurrentTheme(themeId);
      setThemeStyle(getThemeStyle(themeId));
      
      // 调用回调
      if (onThemeChange) {
        onThemeChange(themeId, getThemeStyle(themeId));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('应用主题失败:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onThemeChange, saveToStorage, applyOnMount]);

  // 监听外部主题变更
  useEffect(() => {
    // 如果不需要应用主题，不添加事件监听器
    if (!applyOnMount || typeof window === 'undefined') {
      return () => {};
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        // 处理主题变更
        if (customEvent.detail.theme) {
          setCurrentTheme(customEvent.detail.theme);
          setThemeStyle(customEvent.detail.styles);
        }
        
        // 调用回调
        if (onThemeChange) {
          onThemeChange(
            customEvent.detail.theme || currentTheme, 
            customEvent.detail.styles || getThemeStyle(currentTheme)
          );
        }
      }
    };
    
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, [currentTheme, onThemeChange, applyOnMount]);

  // 初始加载时应用主题
  useEffect(() => {
    if (!applyOnMount || typeof window === 'undefined') {
      return;
    }
    
    // 只在需要保存到localStorage时才尝试从本地存储加载主题
    const savedTheme = saveToStorage ? loadThemeFromStorage() : null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (initialTheme) {
      setTheme(initialTheme);
    } else {
      setTheme('default');
    }
  }, [applyOnMount, initialTheme, setTheme, saveToStorage]);

  return {
    currentTheme,
    themeStyle,
    setTheme,
    isLoading
  };
} 