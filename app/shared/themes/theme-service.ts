import { themeDefinitions, ThemeStyle } from './theme-definitions';

// 主题变更事件名称
export const THEME_CHANGE_EVENT = 'theme-changed';

// 本地存储键名
export const THEME_STORAGE_KEY = 'user-theme';

/**
 * 获取主题样式对象
 * @param themeId 主题ID
 * @returns 主题样式对象
 */
export function getThemeStyle(themeId: string = 'default'): ThemeStyle {
  return themeDefinitions[themeId] || themeDefinitions.default;
}

/**
 * 应用主题到文档
 * @param themeId 主题ID
 * @param dispatchEvent 是否触发主题变更事件
 */
export function applyTheme(themeId: string = 'default', dispatchEvent: boolean = true): void {
  const themeStyle = getThemeStyle(themeId);
  
  // 应用基础CSS变量
  document.documentElement.style.setProperty('--theme-primary', themeStyle.primary);
  document.documentElement.style.setProperty('--theme-secondary', themeStyle.secondary);
  document.documentElement.style.setProperty('--theme-background', themeStyle.background);
  
  if (themeStyle.accent) {
    document.documentElement.style.setProperty('--theme-accent', themeStyle.accent);
  }
  
  if (themeStyle.card) {
    document.documentElement.style.setProperty('--theme-card', themeStyle.card);
  }
  
  if (themeStyle.text) {
    document.documentElement.style.setProperty('--theme-text', themeStyle.text);
  }
  
  // 应用状态颜色
  if (themeStyle.success) {
    document.documentElement.style.setProperty('--theme-success', themeStyle.success);
  }
  
  if (themeStyle.error) {
    document.documentElement.style.setProperty('--theme-error', themeStyle.error);
  }
  
  if (themeStyle.warning) {
    document.documentElement.style.setProperty('--theme-warning', themeStyle.warning);
  }
  
  if (themeStyle.info) {
    document.documentElement.style.setProperty('--theme-info', themeStyle.info);
  }
  
  // 应用状态颜色浅色版
  if (themeStyle.successLight) {
    document.documentElement.style.setProperty('--theme-success-light', themeStyle.successLight);
  }
  
  if (themeStyle.errorLight) {
    document.documentElement.style.setProperty('--theme-error-light', themeStyle.errorLight);
  }
  
  if (themeStyle.warningLight) {
    document.documentElement.style.setProperty('--theme-warning-light', themeStyle.warningLight);
  }
  
  if (themeStyle.infoLight) {
    document.documentElement.style.setProperty('--theme-info-light', themeStyle.infoLight);
  }
  
  // 保存到localStorage以实现跨页面共享
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
  
  // 触发全局主题变更事件
  if (dispatchEvent && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { 
      detail: { theme: themeId, styles: themeStyle } 
    }));
  }
  
  console.log(`已应用主题: ${themeId}`, themeStyle);
}

/**
 * 从localStorage加载主题
 * @returns 加载的主题ID或null
 */
export function loadThemeFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY);
}

/**
 * 添加主题变更事件监听
 * @param callback 回调函数
 * @returns 移除监听器的函数
 */
export function addThemeChangeListener(callback: (themeId: string, themeStyle: ThemeStyle) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleThemeChange = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.theme) {
      callback(customEvent.detail.theme, customEvent.detail.styles);
    }
  };
  
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  
  // 返回移除监听器的函数
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

/**
 * 创建React钩子所需的主题变更事件处理函数
 * @param applyFn 应用主题的函数
 */
export function createThemeChangeHandler(applyFn: (themeId: string) => void) {
  return (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.theme) {
      applyFn(customEvent.detail.theme);
    }
  };
}

/**
 * 获取所有可用主题
 * @returns 主题ID和名称的数组
 */
export function getAllThemes(): Array<{id: string, name: string}> {
  return Object.entries(themeDefinitions).map(([id, theme]) => ({
    id,
    name: theme.name || id
  }));
}

/**
 * 获取指定类别的主题
 * @param category 主题类别
 * @returns 主题ID和名称的数组
 */
export function getThemesByCategory(categories: Record<string, string[]>): Record<string, Array<{id: string, name: string}>> {
  const result: Record<string, Array<{id: string, name: string}>> = {};
  
  Object.entries(categories).forEach(([category, themeIds]) => {
    result[category] = themeIds
      .filter(id => themeDefinitions[id])
      .map(id => ({
        id,
        name: themeDefinitions[id].name || id
      }));
  });
  
  return result;
} 