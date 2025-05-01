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
 * @returns 移除监听器的函数
 */
export function createThemeChangeHandler(callback: (event: CustomEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleThemeChange = (e: Event) => {
    callback(e as CustomEvent);
  };
  
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  
  // 返回移除监听器的函数
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

/**
 * 主题事件详情接口
 */
interface ThemeEventDetails {
  theme: string;
  styles: ThemeStyle;
}

/**
 * 通知主题变更事件
 * 在主题发生变化时通知所有监听者
 * 
 * @param details 事件详情部分内容
 */
function notifyThemeChange(details: Partial<ThemeEventDetails>): void {
  if (typeof window === 'undefined') return;
  
  // 确保默认值
  const currentTheme = details.theme || (lastAppliedTheme ? lastAppliedTheme : 'default');
  
  // 创建完整的事件详情
  const fullDetails: ThemeEventDetails = {
    theme: currentTheme,
    styles: details.styles || getThemeStyle(currentTheme)
  };
  
  // 创建并派发自定义事件
  const event = new CustomEvent(THEME_CHANGE_EVENT, {
    detail: fullDetails
  });
  
  window.dispatchEvent(event);
}

/**
 * 应用主题
 * @param themeId 主题ID
 * @returns 应用的主题样式对象
 */
export function applyTheme(themeId: string): ThemeStyle | null {
  try {
    // 获取并应用主题样式
    const style = applyPresetTheme(themeId);
    if (!style) return null;
    
    // 添加到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
    
    // 触发主题变更事件
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(THEME_CHANGE_EVENT, {
        detail: {
          theme: themeId,
          styles: style
        }
      });
      window.dispatchEvent(event);
    }
    
    return style;
  } catch (error) {
    console.error('应用主题时出错:', error);
    return null;
  }
}

/**
 * 保存自定义主题
 * @param id 主题ID
 * @param theme 主题样式
 * @returns 是否保存成功
 */
export function saveCustomTheme(id: string, theme: ThemeStyle): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 确保主题对象有有效的名称
    if (!theme.name) {
      theme.name = id;
    }
    
    // 将自定义主题添加到内存中
    customThemes[id] = theme;
    
    // 序列化并保存到localStorage
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
    
    console.log(`自定义主题 ${id} 已保存`);
    return true;
  } catch (error) {
    console.error('保存自定义主题失败:', error);
    return false;
  }
}

/**
 * 删除自定义主题
 * @param id 主题ID
 * @returns 是否删除成功
 */
export function deleteCustomTheme(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 如果主题不存在，返回成功
    if (!customThemes[id]) {
      return true;
    }
    
    // 从内存中删除主题
    delete customThemes[id];
    
    // 更新localStorage
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
    
    console.log(`自定义主题 ${id} 已删除`);
    
    // 如果当前使用的是被删除的主题，切换到默认主题
    if (lastAppliedTheme === id) {
      applyTheme('default');
    }
    
    return true;
  } catch (error) {
    console.error('删除自定义主题失败:', error);
    return false;
  }
}

/**
 * 检查主题是否存在
 * @param themeId 主题ID
 * @returns 主题是否存在
 */
export function themeExists(themeId: string): boolean {
  return themeId in themeDefinitions || themeId in customThemes;
}

/**
 * 获取主题样式
 * @param themeId 主题ID
 * @returns 主题样式对象
 */
export function getThemeStyle(themeId: string = 'default'): ThemeStyle {
  if (themeDefinitions[themeId]) {
    return themeDefinitions[themeId];
  }
  
  if (customThemes[themeId]) {
    return customThemes[themeId];
  }
  
  return themeDefinitions['default'];
}

/**
 * 应用预设主题
 * @param themeId 主题ID
 * @returns 应用的主题样式
 */
function applyPresetTheme(themeId: string): ThemeStyle {
  if (typeof document === 'undefined') {
    return getThemeStyle(themeId);
  }
  
  // 获取主题样式
  const style = getThemeStyle(themeId);
  
  // 应用CSS变量到根元素
  document.documentElement.style.setProperty('--theme-primary', style.primary || '#3b82f6');
  document.documentElement.style.setProperty('--theme-secondary', style.secondary || '#6366f1');
  document.documentElement.style.setProperty('--theme-accent', style.accent || '#8b5cf6');
  document.documentElement.style.setProperty('--theme-success', style.success || '#22c55e');
  document.documentElement.style.setProperty('--theme-warning', style.warning || '#eab308');
  document.documentElement.style.setProperty('--theme-error', style.error || '#ef4444');
  document.documentElement.style.setProperty('--theme-info', style.info || '#3b82f6');
  
  // 应用背景
  document.documentElement.style.setProperty('--theme-background', style.background || 'linear-gradient(to right, #f0f9ff, #e0f2fe)');
  
  // 应用文本和卡片颜色
  document.documentElement.style.setProperty('--theme-text', style.text || '#1e293b');
  document.documentElement.style.setProperty('--theme-card', style.card || 'rgba(255, 255, 255, 0.8)');
  document.documentElement.style.setProperty('--theme-border', '#e2e8f0');
  
  // 应用阴影
  document.documentElement.style.setProperty('--theme-card-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
  document.documentElement.style.setProperty('--theme-button-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)');
  document.documentElement.style.setProperty('--theme-button-hover-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.05)');
  
  // 更新文档根样式
  document.documentElement.style.setProperty('--background', '#ffffff');
  document.documentElement.style.setProperty('--foreground', style.text || '#1e293b');
  
  // 特殊处理纯色系统
  if (style.category === '纯色系统') {
    console.log('检测到纯色系统，正在应用纯色设置');
    
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
 * @param callback 回调函数，接收主题ID和样式
 * @returns 移除监听器的函数
 */
export function addThemeChangeListener(
  callback: (themeId: string, themeStyle: ThemeStyle) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleThemeChange = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail) {
      const themeId = customEvent.detail.theme || lastAppliedTheme || 'default';
      const style = customEvent.detail.styles || getThemeStyle(themeId);
      
      callback(themeId, style);
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