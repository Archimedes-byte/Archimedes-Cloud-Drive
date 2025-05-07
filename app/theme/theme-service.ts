/**
 * 主题服务
 * 集中处理主题应用和管理逻辑
 */
import { themeDefinitions } from '@/app/theme/theme-definitions';
import { ThemeStyle } from '@/app/types/theme';

// 主题变更事件名称
export const THEME_CHANGE_EVENT = 'theme-change';

// 主题存储键
export const THEME_STORAGE_KEY = 'app-theme-preference';

// 自定义主题存储键
export const CUSTOM_THEMES_STORAGE_KEY = 'custom-themes';

// 获取用户特定的主题存储键
export const getUserThemeKey = (userId?: string) => 
  userId ? `${CUSTOM_THEMES_STORAGE_KEY}-${userId}` : CUSTOM_THEMES_STORAGE_KEY;

// 自定义主题存储
let customThemes: Record<string, ThemeStyle> = {};

// 记录最后应用的主题
let lastAppliedThemeId: string | null = null;

/**
 * 初始化自定义主题
 * @param userId 用户ID
 */
export function initCustomThemes(userId?: string) {
  if (typeof window === 'undefined') return;
  
  const themeKey = getUserThemeKey(userId);
  
  try {
    const savedThemes = localStorage.getItem(themeKey);
    
    if (savedThemes) {
      customThemes = JSON.parse(savedThemes);
    } else {
      customThemes = {};
    }
  } catch (error) {
    console.error('初始化自定义主题失败:', error);
    customThemes = {};
  }
}

/**
 * 重新初始化自定义主题
 * @param userId 用户ID
 */
export function reinitCustomThemes(userId?: string) {
  customThemes = {};
  initCustomThemes(userId);
}

/**
 * 同步用户自定义主题
 * @param userId 用户ID
 * @param themeId 当前主题ID
 */
export function syncCustomThemesForUser(userId: string, themeId?: string | null) {
  if (typeof window === 'undefined' || !userId) return;
  
  try {
    // 同步用户自定义主题到内存
    reinitCustomThemes(userId);
    
    // 如果有指定主题，尝试应用
    if (themeId && themeId.startsWith('custom_')) {
      applyTheme(themeId, true, userId);
    }
  } catch (error) {
    console.error('同步用户自定义主题失败:', error);
  }
}

/**
 * 应用主题
 * @param themeId 主题ID
 * @param saveToStorage 是否保存到本地存储
 * @param userId 用户ID
 * @returns 应用的主题样式或null
 */
export function applyTheme(
  themeId: string, 
  saveToStorage: boolean = true,
  userId?: string
): ThemeStyle | null {
  // 防止重复应用相同主题
  if (lastAppliedThemeId === themeId) {
    const style = getThemeStyle(themeId);
    return style;
  }
  
  try {
    let theme: ThemeStyle | null = null;
    
    // 检查是否为预设主题
    if (themeDefinitions[themeId]) {
      theme = applyThemeStyles(themeDefinitions[themeId]);
    } 
    // 检查是否为自定义主题
    else if (themeId.startsWith('custom_')) {
      // 确保已加载自定义主题
      if (Object.keys(customThemes).length === 0) {
        reinitCustomThemes(userId);
      }
      
      if (customThemes[themeId]) {
        theme = applyThemeStyles(customThemes[themeId]);
      } else {
        console.warn(`自定义主题 ${themeId} 未找到，使用默认主题`);
        theme = applyThemeStyles(themeDefinitions.default);
      }
    } 
    // 未知主题，使用默认主题
    else {
      console.warn(`未知主题 ${themeId}，使用默认主题`);
      theme = applyThemeStyles(themeDefinitions.default);
    }
    
    // 如果应用成功，保存设置并发出事件
    if (theme) {
      // 更新最后应用的主题
      lastAppliedThemeId = themeId;
      
      // 保存到localStorage
      if (saveToStorage && typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
      }
      
      // 设置document.body的data-theme属性
      if (typeof document !== 'undefined') {
        document.body.dataset.theme = themeId;
        
        // 设置pure-color-theme类
        if (theme.secondary === theme.primary) {
          document.documentElement.classList.add('pure-color-theme');
        } else {
          document.documentElement.classList.remove('pure-color-theme');
        }
      }
      
      // 发出主题变更事件
      notifyThemeChange({
        theme: themeId,
        styles: theme
      });
      
      return theme;
    }
    
    return null;
  } catch (error) {
    console.error('应用主题失败:', error);
    return null;
  }
}

/**
 * 应用主题样式到DOM
 * 统一处理预设主题和自定义主题的样式应用
 * 
 * @param theme 主题样式对象
 * @returns 主题样式
 */
function applyThemeStyles(theme: ThemeStyle): ThemeStyle {
  if (typeof document === 'undefined') {
    return theme;
  }
  
  // 创建CSS变量映射对象 - 为批量更新做准备
  const cssVars: Record<string, string> = {
    // 主题颜色
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary || theme.primary,
    '--theme-accent': theme.accent || theme.secondary || theme.primary,
    '--theme-background': theme.background,
    
    // 文本颜色
    '--theme-text': theme.text || '#1a202c',
    '--theme-text-secondary': theme.textSecondary || '#4a5568',
    '--theme-text-disabled': theme.textDisabled || '#a0aec0',
    
    // 状态颜色
    '--theme-success': theme.success || '#22c55e',
    '--theme-warning': theme.warning || '#eab308',
    '--theme-error': theme.error || '#ef4444',
    '--theme-info': theme.info || theme.primary,
    
    // 界面样式
    '--theme-border': theme.border || '#e2e8f0',
    '--theme-card': theme.card || 'rgba(255, 255, 255, 0.8)',
    
    // 基础系统变量
    '--theme-bg': theme.background.startsWith('linear-gradient') ? '#ffffff' : theme.background,
    '--theme-fg': theme.text || '#1a202c',
  };
  
  // 派生RGB版本的变量
  const rgbFromHex = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? '0, 0, 0' : `${r}, ${g}, ${b}`;
  };
  
  // 尝试为纯色添加RGB变量
  try {
    if (theme.primary && theme.primary.startsWith('#')) {
      cssVars['--theme-primary-rgb'] = rgbFromHex(theme.primary);
    }
    
    if (theme.text && theme.text.startsWith('#')) {
      cssVars['--theme-fg-rgb'] = rgbFromHex(theme.text);
    }
    
    // 如果背景是纯色，尝试添加RGB变量
    if (theme.background && theme.background.startsWith('#')) {
      cssVars['--theme-bg-start-rgb'] = rgbFromHex(theme.background);
      cssVars['--theme-bg-end-rgb'] = rgbFromHex(theme.background);
    }
  } catch (e) {
    console.warn('生成RGB变量失败:', e);
  }
  
  // 批量应用CSS变量 - 减少DOM重绘次数
  Object.entries(cssVars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  // 处理特殊背景情况（渐变等）
  if (theme.background && !theme.background.startsWith('#')) {
  updateGlobalStylesheet(theme.background);
  }
  
  return theme;
}

/**
 * 更新全局样式表
 * @param background 背景颜色或渐变
 */
function updateGlobalStylesheet(background: string): void {
  const styleId = 'global-theme-background';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = `
    :root {
      --theme-background: ${background};
    }
    body:not(.home-page), html:not(.home-page) {
      background: ${background} !important;
      transition: background 0.3s ease;
    }
    .theme-background-applied:not(.home-page) {
      background: ${background} !important;
    }
  `;
}

/**
 * 获取主题样式
 * @param themeId 主题ID
 * @returns 主题样式
 */
export function getThemeStyle(themeId: string = 'default'): ThemeStyle {
  // 检查预设主题
  if (themeDefinitions[themeId]) {
    return themeDefinitions[themeId];
  }
  
  // 检查自定义主题
  if (themeId.startsWith('custom_') && customThemes[themeId]) {
    return customThemes[themeId];
  }
  
  // 返回默认主题
  return themeDefinitions.default;
}

/**
 * 保存自定义主题
 * @param id 主题ID
 * @param theme 主题样式
 * @param userId 用户ID
 * @returns 是否保存成功
 */
export function saveCustomTheme(id: string, theme: ThemeStyle, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const themeKey = getUserThemeKey(userId);
    
    // 添加到内存缓存
    customThemes[id] = theme;
    
    // 保存到localStorage
    localStorage.setItem(themeKey, JSON.stringify(customThemes));
    
    return true;
  } catch (error) {
      console.error('保存自定义主题失败:', error);
    return false;
  }
}

/**
 * 删除自定义主题
 * @param id 主题ID
 * @param userId 用户ID
 * @returns 是否删除成功
 */
export function deleteCustomTheme(id: string, userId?: string): boolean {
  if (typeof window === 'undefined' || !id.startsWith('custom_')) return false;
  
  try {
    const themeKey = getUserThemeKey(userId);
    
    // 从内存缓存中删除
    if (customThemes[id]) {
      delete customThemes[id];
    } else {
      return false; // 主题不存在
    }
    
    // 保存到localStorage
    localStorage.setItem(themeKey, JSON.stringify(customThemes));
    
    return true;
  } catch (error) {
    console.error('删除自定义主题失败:', error);
    return false;
  }
}

/**
 * 从本地存储加载主题
 * @returns 保存的主题ID或null
 */
export function loadThemeFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error('从本地存储加载主题失败:', error);
    return null;
  }
}

/**
 * 通知主题变更
 * @param details 主题变更详情
 */
function notifyThemeChange(details: { theme: string, styles: ThemeStyle }): void {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent(THEME_CHANGE_EVENT, { 
    detail: details 
  });
  
  window.dispatchEvent(event);
}

/**
 * 添加主题变更监听器
 * @param callback 回调函数
 * @returns 移除监听器的函数
 */
export function addThemeChangeListener(
  callback: (themeId: string, themeStyle: ThemeStyle) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleThemeChange = (e: Event) => {
    const customEvent = e as CustomEvent<{ theme: string, styles: ThemeStyle }>;
    const { theme, styles } = customEvent.detail;
    
    callback(theme, styles);
  };
  
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

/**
 * 获取所有可用主题
 * @param userId 用户ID
 * @returns 主题列表
 */
export function getAllThemes(userId?: string): Array<{id: string, name: string, category: string}> {
  // 确保加载自定义主题
  if (Object.keys(customThemes).length === 0) {
    reinitCustomThemes(userId);
  }
  
  // 合并预设主题和自定义主题
  const themes: Array<{id: string, name: string, category: string}> = [];
  
  // 添加预设主题
  Object.keys(themeDefinitions).forEach(id => {
    const theme = themeDefinitions[id];
    themes.push({
    id,
    name: theme.name || id,
      category: theme.category || '预设'
    });
  });
  
  // 添加自定义主题
  Object.keys(customThemes).forEach(id => {
    const theme = customThemes[id];
    themes.push({
    id,
    name: theme.name || id,
      category: '自定义'
    });
  });
  
  return themes;
}

/**
 * 根据分类获取主题
 * @param categories 需要获取的主题分类
 * @returns 按分类组织的主题列表
 */
export function getThemesByCategory(
  categories: Record<string, string[]>
): Record<string, Array<{id: string, name: string}>> {
  const result: Record<string, Array<{id: string, name: string}>> = {};
  
  // 初始化结果对象
  Object.keys(categories).forEach(category => {
    result[category] = [];
  });
  
  // 添加预设主题
  Object.keys(themeDefinitions).forEach(id => {
    const theme = themeDefinitions[id];
    const category = theme.category || '预设';
    
    if (categories[category]) {
      result[category].push({
        id,
        name: theme.name || id
      });
    }
  });
  
  // 添加自定义主题
  Object.keys(customThemes).forEach(id => {
    const theme = customThemes[id];
    
    if (categories['自定义']) {
      result['自定义'].push({
        id,
        name: theme.name || id
      });
    }
  });
  
  return result;
}

/**
 * 获取对比度颜色，用于确定在特定背景色上的最佳文本颜色
 * @param backgroundColor 背景颜色
 * @param darkColor 深色选项
 * @param lightColor 浅色选项
 * @returns 最佳对比度的颜色
 */
export function getContrastColor(
  backgroundColor: string, 
  darkColor: string = '#1a202c', 
  lightColor: string = '#ffffff'
): string {
  // 如果背景色是渐变色，提取第一个颜色
  const baseColor = backgroundColor.includes('gradient') 
    ? backgroundColor.match(/#[a-fA-F0-9]{6}/)?.[0] || backgroundColor
    : backgroundColor;
  
  // 将16进制颜色转换为RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgb = hexToRgb(baseColor);
  
  // 如果颜色格式无效，返回黑色文本
  if (!rgb) return darkColor;
  
  // 计算亮度 - 使用相对亮度公式
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  
  // 根据亮度返回适当的文本颜色 (亮度范围0-255，128为中点)
  return luminance > 128 ? darkColor : lightColor;
}

/**
 * 获取主题变量值
 * 
 * @param varName 变量名（不含--前缀）
 * @returns 变量值或默认值
 */
export function getThemeVariable(varName: string, defaultValue: string = ''): string {
  if (typeof document === 'undefined') {
    return defaultValue;
  }
  
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--theme-${varName}`).trim();
  return value || defaultValue;
}

// 初始化自定义主题
initCustomThemes(); 