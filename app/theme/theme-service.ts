import { themeDefinitions, ThemeStyle } from '@/app/theme/theme-definitions';

// 主题类型定义
export interface Theme {
  id: string;
  name: string;
  type: 'preset' | 'custom';
}

export interface ThemeCategory {
  id: string;
  name: string;
  themes: string[];
}

/**
 * 主题变更事件名称
 * 用于在应用程序中广播主题变更消息
 */
export const THEME_CHANGE_EVENT = 'theme-change';

/**
 * 主题存储键
 * 用于在localStorage中保存当前主题ID
 */
export const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * 自定义主题存储键
 * 用于在localStorage中保存用户自定义主题
 */
export const CUSTOM_THEMES_STORAGE_KEY = 'custom-themes';

// 自定义主题存储
let customThemes: Record<string, ThemeStyle> = {};

// 记录最后应用的主题ID，用于防止重复应用
let lastAppliedTheme: string | null = null;
// 标记主题应用进行中，防止重入
let isApplyingTheme = false;

// 初始化自定义主题
initCustomThemes();

/**
 * 初始化自定义主题
 * 从localStorage加载保存的自定义主题
 */
function initCustomThemes() {
  if (typeof window === 'undefined') return;
  
  try {
    const savedThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (savedThemes) {
      customThemes = JSON.parse(savedThemes);
      console.log('已加载自定义主题:', Object.keys(customThemes).length);
    }
  } catch (error) {
    console.error('加载自定义主题失败:', error);
    customThemes = {};
  }
}

/**
 * 重新初始化自定义主题
 * 用于需要强制刷新自定义主题时
 */
export function reinitCustomThemes() {
  initCustomThemes();
}

/**
 * 清除所有自定义主题
 * @returns 是否成功清除
 */
export function clearCustomThemes(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
    customThemes = {};
    return true;
  } catch (error) {
    console.error('清除自定义主题失败:', error);
    return false;
  }
}

/**
 * 创建主题改变的事件处理器
 * 用于在组件中订阅主题变更事件
 * 
 * @param callback 主题变更回调
 * @returns 事件处理函数
 */
export function createThemeChangeHandler(callback: (theme: string) => void) {
  return function themeChangeHandler(e: Event) {
    const customEvent = e as CustomEvent;
    if (customEvent.detail && customEvent.detail.theme) {
      callback(customEvent.detail.theme);
    }
  };
}

/**
 * 通知主题变更事件
 * 在主题发生变化时通知所有监听者
 * 
 * @param themeId 变更后的主题ID
 * @param themeStyle 变更后的主题样式
 */
function notifyThemeChange(themeId: string, themeStyle: ThemeStyle) {
  if (typeof window === 'undefined') return;
  
  // 创建并派发自定义事件
  const event = new CustomEvent(THEME_CHANGE_EVENT, {
    detail: {
      theme: themeId,
      styles: themeStyle
    }
  });
  
  window.dispatchEvent(event);
}

/**
 * 应用主题
 * 将主题样式应用到文档根元素
 * 
 * @param themeId 要应用的主题ID
 * @param persist 是否保存到localStorage
 * @returns 应用的主题样式
 */
export function applyTheme(themeId: string = 'default', persist: boolean = true): ThemeStyle {
  // 防止重复应用相同主题
  if (lastAppliedTheme === themeId) {
    return getThemeStyle(themeId);
  }
  
  // 防止重入
  if (isApplyingTheme) {
    console.warn('主题正在应用中，请稍后再试');
    return getThemeStyle(themeId);
  }
  
  try {
    isApplyingTheme = true;
    lastAppliedTheme = themeId;
    
    // 获取并应用主题样式
    const style = applyPresetTheme(themeId);
    
    // 是否持久化存储主题设置
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
    
    // 通知主题变更
    notifyThemeChange(themeId, style);
    
    // 输出日志
    console.log(`已应用主题: ${themeId}`);
    
    return style;
  } catch (error) {
    console.error('应用主题失败:', error);
    return getThemeStyle('default');
  } finally {
    isApplyingTheme = false;
  }
}

/**
 * 保存自定义主题
 * @param id 主题ID
 * @param theme 主题样式
 * @returns 保存是否成功
 */
export function saveCustomTheme(id: string, theme: ThemeStyle): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 对主题ID添加custom_前缀以区分
    const themeId = id.startsWith('custom_') ? id : `custom_${id}`;
    
    // 更新自定义主题集合
    customThemes[themeId] = {
      ...theme,
      name: theme.name || id
    };
    
    // 保存到localStorage
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
    
    console.log(`自定义主题已保存: ${themeId}`);
    return true;
  } catch (error) {
    console.error('保存自定义主题失败:', error);
    return false;
  }
}

/**
 * 删除自定义主题
 * @param id 主题ID
 * @returns 删除是否成功
 */
export function deleteCustomTheme(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 检查是不是自定义主题
    if (!id.startsWith('custom_')) {
      console.warn('只能删除自定义主题');
      return false;
    }
    
    // 如果该主题存在，则删除
    if (customThemes[id]) {
      delete customThemes[id];
      
      // 保存更新后的自定义主题集合
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
      
      console.log(`自定义主题已删除: ${id}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('删除自定义主题失败:', error);
    return false;
  }
}

/**
 * 检查主题ID是否存在
 * @param themeId 主题ID
 * @returns 主题是否存在
 */
export function themeExists(themeId: string): boolean {
  return !!themeDefinitions[themeId] || !!(themeId.startsWith('custom_') && customThemes[themeId]);
}

/**
 * 获取主题样式对象
 * @param themeId 主题ID
 * @returns 主题样式对象
 */
export function getThemeStyle(themeId: string = 'default'): ThemeStyle {
  // 先检查是否是自定义主题
  if (themeId.startsWith('custom_') && customThemes[themeId]) {
    return customThemes[themeId];
  }
  
  return themeDefinitions[themeId] || themeDefinitions.default;
}

/**
 * 应用预设主题
 * @param themeId 主题ID
 * @returns 应用的主题样式
 */
function applyPresetTheme(themeId: string): ThemeStyle {
  const style = getThemeStyle(themeId);
  
  // 先移除所有主题相关CSS变量，确保干净的开始
  const cssVarsToCleanup = [
    '--theme-primary',
    '--theme-secondary',
    '--theme-accent',
    '--theme-background',
    '--theme-gradient-start',
    '--theme-gradient-end',
    '--theme-card',
    '--theme-text'
  ];
  
  // 彻底清理所有主题变量
  cssVarsToCleanup.forEach(varName => {
    document.documentElement.style.removeProperty(varName);
  });
  
  console.log('应用主题样式:', style);
  console.log('是否存在次要色调:', !!style.secondary);
  
  // 应用主题样式到CSS变量
  Object.entries(style).forEach(([key, value]) => {
    if (typeof value === 'string' && value) {
      // 只设置有实际值的属性
      if (key !== 'secondary' || (key === 'secondary' && value)) {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      }
    }
  });
  
  // 对纯色系统进行特殊处理
  if (!style.secondary || style.secondary === '') {
    console.log('检测到纯色系统，正在应用纯色设置');
    
    // 强制移除次要色调相关变量
    document.documentElement.style.removeProperty('--theme-secondary');
    document.documentElement.style.removeProperty('--theme-accent');
    
    // 纯色系统 - 背景应该设置为纯色
    if (style.background && style.background.includes('gradient')) {
      console.log('将渐变背景替换为纯色:', style.primary);
      document.documentElement.style.setProperty('--theme-background', style.primary);
    }
    
    // 添加纯色系统标记类，用于CSS选择器
    document.documentElement.classList.add('pure-color-theme');
  } else {
    // 渐变色系统 - 移除纯色系统标记类
    document.documentElement.classList.remove('pure-color-theme');
  }
  
  // 强制重新计算样式
  document.body.style.display = 'none';
  // 使浏览器强制重新计算样式
  void document.body.offsetHeight;
  document.body.style.display = '';
  
  return style;
}

/**
 * 计算颜色对比度
 * @param hexColor 十六进制颜色值
 * @param dark 深色文本
 * @param light 浅色文本
 * @returns 基于背景色的文本颜色
 */
export function getContrastColor(hexColor: string, dark: string = '#1a202c', light: string = '#ffffff'): string {
  // 移除#前缀
  const hex = hexColor.replace('#', '');
  
  // 转换为RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 计算亮度 (ITU-R BT.709)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  
  // 亮度高于0.5使用深色文本，否则使用浅色文本
  return brightness > 0.5 ? dark : light;
}

/**
 * 获取主题背景样式
 * @param theme 主题对象
 * @returns CSS样式对象
 */
export function getThemeBackgroundStyle(theme: ThemeStyle): React.CSSProperties {
  if (!theme) return {};
  
  return {
    background: theme.background,
    color: theme.text || '#1a202c'
  };
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
 * 获取所有可用主题
 * @returns 主题ID和名称的数组
 */
export function getAllThemes(): Array<{id: string, name: string}> {
  // 合并内置主题和自定义主题
  const builtInThemes = Object.entries(themeDefinitions).map(([id, theme]: [string, ThemeStyle]) => ({
    id,
    name: theme.name || id
  }));
  
  const userThemes = Object.entries(customThemes).map(([id, theme]: [string, ThemeStyle]) => ({
    id,
    name: theme.name || id
  }));
  
  return [...builtInThemes, ...userThemes];
}

/**
 * 获取指定类别的主题
 * @param categories 主题类别
 * @returns 主题ID和名称的数组
 */
export function getThemesByCategory(categories: Record<string, string[]>): Record<string, Array<{id: string, name: string}>> {
  const result: Record<string, Array<{id: string, name: string}>> = {};
  
  Object.entries(categories).forEach(([category, themeIds]) => {
    result[category] = themeIds
      .filter(id => themeDefinitions[id] || customThemes[id])
      .map(id => {
        const theme = themeDefinitions[id] || customThemes[id];
        return {
          id,
          name: theme.name || id
        };
      });
  });
  
  return result;
} 