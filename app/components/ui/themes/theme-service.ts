import { themeDefinitions, ThemeStyle } from './theme-definitions';

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

// 模拟theme-data数据，实际项目中应当创建一个真实的文件
const themes: Theme[] = [
  ...Object.keys(themeDefinitions).map(id => ({
    id,
    name: themeDefinitions[id].name || id,
    type: 'preset' as const
  }))
];

// 自定义样式相关功能
const customStyles = {
  // 占位实现，实际项目中应当创建一个真实的文件
};

// 主题变更事件名称
export const THEME_CHANGE_EVENT = 'theme-change';

// 本地存储键名
export const THEME_STORAGE_KEY = 'user-theme';
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
 * 获取当前用户的自定义主题存储键
 * 为每个用户创建独立的自定义主题空间
 * @returns 用户特定的存储键
 */
export function getUserThemeStorageKey(): string {
  // 尝试从localStorage获取用户唯一标识
  const userId = localStorage.getItem('user-id');
  // 如果有用户ID，返回带用户ID的键名
  if (userId) {
    return `${CUSTOM_THEMES_STORAGE_KEY}-${userId}`;
  }
  // 没有用户ID时，返回默认键名
  return CUSTOM_THEMES_STORAGE_KEY;
}

/**
 * 初始化自定义主题
 * 从localStorage加载用户自定义的主题
 */
function initCustomThemes(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // 使用用户特定的存储键
    const userSpecificKey = getUserThemeStorageKey();
    const storedThemes = localStorage.getItem(userSpecificKey);
    
    if (storedThemes) {
      try {
        const parsedThemes = JSON.parse(storedThemes);
        customThemes = parsedThemes;
        
        // 记录加载的主题列表，方便调试
        const themeIds = Object.keys(customThemes);
        console.log(`已加载用户自定义主题(${userSpecificKey}):`, themeIds.length);
        themeIds.forEach(id => {
          console.log(`-- 自定义主题: ${id}, 名称: ${customThemes[id].name || '未命名'}`);
        });
      } catch (parseError) {
        console.error('解析自定义主题JSON失败:', parseError);
        customThemes = {};
      }
    } else {
      // 检查是否存在旧的非用户特定的主题数据，可能是迁移场景
      const oldStoredThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      if (oldStoredThemes && userSpecificKey !== CUSTOM_THEMES_STORAGE_KEY) {
        console.log('发现旧的自定义主题数据，正在迁移到用户特定存储...');
        try {
          customThemes = JSON.parse(oldStoredThemes);
          // 迁移到新的用户特定存储
          localStorage.setItem(userSpecificKey, oldStoredThemes);
          // 清理旧数据
          localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
          console.log('自定义主题迁移完成');
        } catch (parseError) {
          console.error('迁移过程中解析旧自定义主题失败:', parseError);
          customThemes = {};
        }
      } else {
        console.log('未找到自定义主题数据，使用空对象初始化');
        customThemes = {};
      }
    }
  } catch (error) {
    console.error('加载自定义主题失败:', error);
    customThemes = {};
  }
}

/**
 * 重新初始化自定义主题
 * 用于手动触发重新加载自定义主题的场景
 * @returns 加载的自定义主题数量
 */
export function reinitCustomThemes(): number {
  console.log('手动重新初始化自定义主题');
  
  // 备份当前主题ID，用于检测变化
  const previousThemeIds = Object.keys(customThemes);
  
  // 重新初始化
  initCustomThemes();
  
  // 检查是否有变化
  const currentThemeIds = Object.keys(customThemes);
  const added = currentThemeIds.filter(id => !previousThemeIds.includes(id));
  const removed = previousThemeIds.filter(id => !currentThemeIds.includes(id));
  
  if (added.length > 0) {
    console.log('新增自定义主题:', added);
  }
  
  if (removed.length > 0) {
    console.log('移除自定义主题:', removed);
  }
  
  // 更新主题数组，确保内存中的themes列表包含所有自定义主题
  currentThemeIds.forEach(themeId => {
    const existingIndex = themes.findIndex(t => t.id === themeId);
    if (existingIndex === -1) {
      // 添加到themes数组
      themes.push({
        id: themeId,
        name: customThemes[themeId].name || themeId,
        type: 'custom'
      });
      console.log(`将自定义主题 ${themeId} 添加到主题列表`);
    }
  });
  
  return currentThemeIds.length;
}

/**
 * 保存自定义主题
 * @param themeId 主题ID
 * @param themeStyle 主题样式
 * @returns 是否保存成功
 */
export function saveCustomTheme(themeId: string, themeStyle: ThemeStyle): boolean {
  try {
    // 确保主题ID以custom_开头
    const validThemeId = themeId.startsWith('custom_') ? themeId : `custom_${themeId}`;
    
    // 保存到内存中
    customThemes[validThemeId] = {
      ...themeStyle,
      category: '自定义主题' // 确保分类正确
    };
    
    // 保存到用户特定的本地存储
    localStorage.setItem(getUserThemeStorageKey(), JSON.stringify(customThemes));
    
    // 将新的自定义主题添加到themes数组中
    themes.push({
      id: validThemeId,
      name: themeStyle.name || validThemeId,
      type: 'custom'
    });
    
    console.log(`用户自定义主题 ${validThemeId} 已保存并添加到主题列表`);
    return true;
  } catch (error) {
    console.error('保存自定义主题失败:', error);
    return false;
  }
}

/**
 * 删除自定义主题
 * @param themeId 主题ID
 * @returns 是否删除成功
 */
export function deleteCustomTheme(themeId: string): boolean {
  try {
    if (customThemes[themeId]) {
      delete customThemes[themeId];
      // 使用用户特定的存储键
      localStorage.setItem(getUserThemeStorageKey(), JSON.stringify(customThemes));
      
      // 从themes数组中移除
      const themeIndex = themes.findIndex(t => t.id === themeId);
      if (themeIndex !== -1) {
        themes.splice(themeIndex, 1);
      }
      
      console.log(`自定义主题 ${themeId} 已删除`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除自定义主题失败:', error);
    return false;
  }
}

/**
 * 清除所有自定义主题（用于登出等场景）
 */
export function clearCustomThemes(): void {
  try {
    // 清空内存中的自定义主题
    customThemes = {};
    
    // 清除用户特定的自定义主题本地存储
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getUserThemeStorageKey());
    }
    
    // 从themes数组中移除所有自定义主题
    const customIndices = [];
    for (let i = 0; i < themes.length; i++) {
      if (themes[i].id.startsWith('custom_')) {
        customIndices.push(i);
      }
    }
    
    // 从后往前删除，避免索引变化问题
    for (let i = customIndices.length - 1; i >= 0; i--) {
      themes.splice(customIndices[i], 1);
    }
    
    console.log('已清除所有用户自定义主题');
  } catch (error) {
    console.error('清除自定义主题失败:', error);
  }
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
 * 移除所有主题样式
 */
function removeAllThemeStyles(): void {
  // 在实际实现中，这里应该清理之前应用的主题样式
  const existingThemeStyles = document.querySelectorAll('style[data-theme]');
  existingThemeStyles.forEach(element => element.remove());
}

/**
 * 应用预设主题
 * @param themeId 主题ID
 * @returns 应用的主题样式
 */
function applyPresetTheme(themeId: string): ThemeStyle {
  const style = getThemeStyle(themeId);
  
  // 应用主题样式到CSS变量
  Object.entries(style).forEach(([key, value]) => {
    if (typeof value === 'string') {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    }
  });
  
  return style;
}

/**
 * 应用自定义主题
 * @param themeId 主题ID
 * @returns 应用的主题样式
 */
function applyCustomTheme(themeId: string): ThemeStyle {
  const style = customThemes[themeId];
  
  if (!style) {
    console.error(`自定义主题不存在: ${themeId}`);
    return themeDefinitions.default;
  }
  
  // 应用主题样式到CSS变量
  Object.entries(style).forEach(([key, value]) => {
    if (typeof value === 'string') {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    }
  });
  
  return style;
}

/**
 * 应用主题到DOM
 * @param themeId 主题ID
 * @param dispatchEvent 是否触发主题变更事件
 * @returns 应用的主题样式对象
 */
export const applyTheme = (themeId: string, dispatchEvent = true): ThemeStyle | null => {
  // 避免重复应用相同主题，防止循环调用，但仍然返回主题样式以便保存到localStorage
  if (lastAppliedTheme === themeId) {
    console.log('相同主题重新应用:', themeId);
    const style = getThemeStyle(themeId);
    // 即使是同一个主题，我们也保存它
    lastAppliedTheme = themeId;
    // 保存当前主题到localStorage以确保持久化
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
    return style;
  }

  // 防止函数重入导致的循环
  if (isApplyingTheme) {
    console.log('主题应用进行中，跳过重复调用:', themeId);
    return null;
  }

  try {
    isApplyingTheme = true;
    console.log('应用主题:', themeId);
    
    // 主题样式对象
    let themeStyle: ThemeStyle | null = null;
    
    // 检查自定义主题
    if (themeId.startsWith('custom_')) {
      // 如果是自定义主题但在内存中找不到，尝试重新初始化
      if (!customThemes[themeId]) {
        console.log(`自定义主题${themeId}不在内存中，尝试重新初始化`);
        // 重新加载自定义主题
        initCustomThemes();
      }
      
      // 再次检查自定义主题是否存在
      if (customThemes[themeId]) {
        themeStyle = applyCustomTheme(themeId);
        // 应用主题成功后，保存最后应用的主题ID
        lastAppliedTheme = themeId;
        // 更新body的data-theme属性
        document.body.dataset.theme = themeId;
      } else {
        console.error(`自定义主题仍然不存在: ${themeId}，切换到默认主题`);
        // 如果自定义主题确实找不到，应用默认主题但不更改lastAppliedTheme
        themeStyle = applyPresetTheme('default');
        return themeStyle; // 提前返回，不触发事件和保存
      }
    } else {
      // 获取预设主题对象
      const theme = themes.find((t: Theme) => t.id === themeId);
      if (!theme) {
        console.error(`主题不存在: ${themeId}`);
        return null;
      }
      
      // 移除之前的主题样式
      removeAllThemeStyles();
      
      // 应用预设主题
      themeStyle = applyPresetTheme(theme.id);
      
      // 应用主题成功后，保存最后应用的主题ID
      lastAppliedTheme = themeId;
      
      // 更新body的data-theme属性
      document.body.dataset.theme = themeId;
    }
    
    // 保存当前主题到localStorage以确保持久化
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
    
    // 触发主题变更事件
    if (dispatchEvent && typeof window !== 'undefined' && themeStyle) {
      console.log('触发主题变更事件:', themeId);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { 
        detail: { theme: themeId, styles: themeStyle } 
      }));
    }
    
    return themeStyle;
  } catch (error) {
    console.error('应用主题出错:', error);
    return null;
  } finally {
    isApplyingTheme = false;
  }
};

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
  // 合并内置主题和自定义主题
  const builtInThemes = Object.entries(themeDefinitions).map(([id, theme]) => ({
    id,
    name: theme.name || id
  }));
  
  const userThemes = Object.entries(customThemes).map(([id, theme]) => ({
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