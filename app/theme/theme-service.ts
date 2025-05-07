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
// 添加用户前缀，确保每个用户只能看到自己的主题
export const getUserThemeKey = (userId?: string) => userId ? `${CUSTOM_THEMES_STORAGE_KEY}-${userId}` : CUSTOM_THEMES_STORAGE_KEY;

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
 * 从localStorage中加载用户自定义主题
 * @param userId 用户ID，用于加载特定用户的主题
 */
function initCustomThemes(userId?: string) {
  if (typeof window === 'undefined') return;
  
  // 使用用户特定的键
  const themeKey = getUserThemeKey(userId);
  
  try {
    // 从localStorage加载自定义主题
    const savedThemes = localStorage.getItem(themeKey);
    
    if (savedThemes) {
      try {
        // 解析并存储到内存中
        const parsedThemes = JSON.parse(savedThemes);
        customThemes = parsedThemes;
        
        // 运行自动修复功能，确保所有主题具有必要的属性
        repairCustomThemes(userId);
        
        console.log(`已从localStorage加载${Object.keys(parsedThemes).length}个自定义主题`);
      } catch (parseError) {
        console.error('解析自定义主题失败:', parseError);
        // 解析失败时使用空对象
        customThemes = {};
      }
    } else {
      console.log('没有找到保存的自定义主题');
      customThemes = {};
    }
  } catch (error) {
    console.error('初始化自定义主题失败:', error);
    customThemes = {};
  }
}

/**
 * 重新初始化自定义主题
 * 用于在用户登录或切换时更新主题
 * @param userId 用户ID
 */
export function reinitCustomThemes(userId?: string) {
  console.log(`重新初始化自定义主题: userId=${userId || '未登录'}`);
  
  // 清空当前主题
  customThemes = {};
  
  // 加载特定用户的主题
  initCustomThemes(userId);
  
  // 输出加载结果
  const themeCount = Object.keys(customThemes).length;
  console.log(`用户 ${userId || '未登录'} 的自定义主题已加载: ${themeCount}个`);
  if (themeCount > 0 && process.env.NODE_ENV === 'development') {
    console.log('已加载的自定义主题IDs:', Object.keys(customThemes));
  }
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
 * @param saveToStorage 是否保存到localStorage，默认为true
 * @param userId 用户ID，确保自定义主题隔离
 * @returns 应用的主题样式对象
 */
export function applyTheme(themeId: string, saveToStorage: boolean = true, userId?: string): ThemeStyle | null {
  console.log(`尝试应用主题: ${themeId}, userId=${userId || '未登录'}`);
  
  // 防止重入和重复应用相同主题
  if (isApplyingTheme) {
    console.log(`主题应用进行中，跳过此次应用: ${themeId}`);
    return getThemeStyle(themeId);
  }
  
  if (lastAppliedTheme === themeId && themeId !== 'default') {
    console.log(`主题 ${themeId} 已经被应用，无需重复应用`);
    return getThemeStyle(themeId);
  }
  
  isApplyingTheme = true;
  
  try {
    // 特殊处理'custom'主题ID - 找出实际的自定义主题
    if (themeId === 'custom') {
      const customThemeIds = Object.keys(customThemes).filter(id => id.startsWith('custom_'));
      if (customThemeIds.length > 0) {
        const actualThemeId = customThemeIds[0];
        console.log(`将'custom'映射到实际自定义主题: ${actualThemeId}`);
        themeId = actualThemeId;
      } else {
        console.warn(`未找到可用的自定义主题，将使用默认主题`);
        themeId = 'default';
      }
    }
    
    lastAppliedTheme = themeId;
    
    // 如果是自定义主题，确保已加载特定用户的主题
    if (themeId.startsWith('custom_')) {
      console.log(`检测到自定义主题 ${themeId}，确保加载用户 ${userId || '未登录'} 的主题`);
      
      // 先尝试加载无用户ID的匿名主题（向后兼容）
      initCustomThemes();
      
      // 如果找不到主题并且有用户ID，则尝试加载用户特定的主题
      if (!customThemes[themeId] && userId) {
        console.log(`在匿名主题中未找到 ${themeId}，尝试加载用户 ${userId} 的主题`);
        reinitCustomThemes(userId);
        // 运行修复程序确保主题属性完整
        repairCustomThemes(userId);
      }
      
      // 如果仍找不到，尝试从其他可能的用户ID存储中查找
      if (!customThemes[themeId]) {
        // 从主题ID中提取用户ID前缀
        const match = themeId.match(/^custom_([^_]+)/);
        if (match && match[1]) {
          const extractedUserId = match[1];
          if (extractedUserId !== 'anonymous' && extractedUserId !== (userId || '')) {
            console.log(`尝试从ID前缀 ${extractedUserId} 加载主题`);
            // 尝试使用从ID提取的用户ID加载主题
            const themeKey = getUserThemeKey(extractedUserId);
            try {
              const savedThemes = localStorage.getItem(themeKey);
              if (savedThemes) {
                const otherUserThemes = JSON.parse(savedThemes);
                if (otherUserThemes[themeId]) {
                  console.log(`在用户 ${extractedUserId} 的存储中找到主题 ${themeId}`);
                  // 将找到的主题添加到当前内存中
                  customThemes[themeId] = otherUserThemes[themeId];
                }
              }
            } catch (err) {
              console.error(`从其他用户加载主题时出错:`, err);
            }
          }
        }
      }
      
      // 最终检查主题是否存在
      if (!customThemes[themeId]) {
        console.warn(`自定义主题 ${themeId} 不存在，即将使用默认主题`);
        themeId = 'default';
      } else {
        console.log(`自定义主题 ${themeId} 已存在，准备应用`);
        // 检查并修复该主题的属性
        let needsRepair = false;
        const theme = customThemes[themeId];
        
        // 确保渐变色背景正确
        if (theme.secondary && !theme.background.includes('linear-gradient')) {
          theme.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
          needsRepair = true;
        }
        
        // 如果需要修复，保存回存储
        if (needsRepair) {
          console.log(`为主题 ${themeId} 补全缺失的属性`);
          saveCustomTheme(themeId, theme, userId);
        }
      }
    }
    
    // 获取并应用主题样式
    const style = applyPresetTheme(themeId);
    if (!style) {
      console.error(`应用主题 ${themeId} 失败，无法获取主题样式`);
      return null;
    }
    
    // 添加到localStorage，如果需要的话
    if (saveToStorage && typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      console.log(`主题 ${themeId} 已保存到localStorage`);
    }
    
    // 触发主题变更事件
    notifyThemeChange({
      theme: themeId,
      styles: style
    });
    
    console.log(`主题 ${themeId} 应用成功`);
    return style;
  } catch (error) {
    // 避免在控制台输出过多错误
    console.error('应用主题时出错:', error);
    return null;
  } finally {
    isApplyingTheme = false;
  }
}

/**
 * 保存自定义主题
 * @param id 主题ID
 * @param theme 主题样式
 * @param userId 用户ID，用于将主题与特定用户关联
 * @returns 是否保存成功
 */
export function saveCustomTheme(id: string, theme: ThemeStyle, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 确保主题对象有有效的名称
    if (!theme.name) {
      theme.name = id;
    }
    
    // 确保渐变色主题的关键属性都被正确保存
    if (theme.secondary && (!theme.background || !theme.background.includes('linear-gradient'))) {
      // 自动补全渐变背景
      theme.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
      console.log(`为主题 ${id} 自动补全渐变背景: ${theme.background}`);
    }
    
    // 确保分类正确
    if (theme.secondary) {
      theme.category = theme.category || '渐变主题';
    } else {
      theme.category = theme.category || '纯色系统';
    }
    
    // 确保自定义主题有完整的文本和卡片属性
    if (!theme.text) {
      theme.text = theme.secondary ? '#1a202c' : getContrastColor(theme.primary, '#1a202c', '#ffffff');
    }
    
    if (!theme.card) {
      theme.card = theme.secondary ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
    }
    
    // 确保辅助颜色正确设置
    if (!theme.success) theme.success = '#48bb78';
    if (!theme.error) theme.error = '#f56565';
    if (!theme.warning) theme.warning = '#ecc94b';
    if (!theme.info) theme.info = '#4299e1';
    if (!theme.successLight) theme.successLight = 'rgba(72, 187, 120, 0.2)';
    if (!theme.errorLight) theme.errorLight = 'rgba(245, 101, 101, 0.2)';
    if (!theme.warningLight) theme.warningLight = 'rgba(236, 201, 75, 0.2)';
    if (!theme.infoLight) theme.infoLight = 'rgba(66, 153, 225, 0.2)';
    
    // 将自定义主题添加到内存中
    customThemes[id] = theme;
    
    // 使用用户特定的键保存主题
    const themeKey = getUserThemeKey(userId);
    
    // 先获取现有的主题数据
    let userThemes: Record<string, ThemeStyle> = {};
    try {
      const savedThemes = localStorage.getItem(themeKey);
      if (savedThemes) {
        userThemes = JSON.parse(savedThemes);
      }
    } catch (parseError) {
      console.error('解析现有主题数据失败:', parseError);
      // 如果解析失败，使用当前内存中的主题
      userThemes = {...customThemes};
    }
    
    // 添加新主题
    userThemes[id] = theme;
    
    // 序列化并保存到用户特定的localStorage
    localStorage.setItem(themeKey, JSON.stringify(userThemes));
    
    // 如果有用户ID，也保存到匿名存储中以提高兼容性
    if (userId) {
      try {
        const anonymousKey = CUSTOM_THEMES_STORAGE_KEY;
        let anonymousThemes: Record<string, ThemeStyle> = {};
        
        // 读取匿名存储
        const savedAnonymousThemes = localStorage.getItem(anonymousKey);
        if (savedAnonymousThemes) {
          anonymousThemes = JSON.parse(savedAnonymousThemes);
        }
        
        // 添加新主题
        anonymousThemes[id] = theme;
        
        // 保存到匿名存储
        localStorage.setItem(anonymousKey, JSON.stringify(anonymousThemes));
        console.log(`主题 ${id} 也保存到匿名存储，提高兼容性`);
      } catch (anonError) {
        console.error('保存到匿名存储失败:', anonError);
        // 保存到匿名存储失败不应该影响整体结果
      }
    }
    
    // 仅在开发环境输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`自定义主题 ${id} 已保存, 用户ID: ${userId || '未登录'}`);
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('保存自定义主题失败:', error);
    }
    return false;
  }
}

/**
 * 删除自定义主题
 * @param id 主题ID
 * @param userId 用户ID，用于确定删除特定用户的主题
 * @returns 是否删除成功
 */
export function deleteCustomTheme(id: string, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 如果主题不存在，无需删除
    if (!customThemes[id]) {
      return false;
    }
    
    // 从内存中删除
    delete customThemes[id];
    
    // 使用用户特定的键保存更新后的主题集合
    const themeKey = getUserThemeKey(userId);
    localStorage.setItem(themeKey, JSON.stringify(customThemes));
    
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
  
  // 判断是否为纯色系统 - 检查有无次要色调和分类标记
  const isPureColorSystem = 
    (style.category === '纯色系统') || 
    (!style.secondary && (!style.background.includes('linear-gradient')));
  
  console.log(`应用主题 ${themeId}，isPureColorSystem=${isPureColorSystem}`, {
    category: style.category,
    primary: style.primary,
    secondary: style.secondary,
    background: style.background
  });
  
  // 应用CSS变量到根元素
  document.documentElement.style.setProperty('--theme-primary', style.primary || '#3b82f6');
  
  // 对于纯色系统，所有颜色都使用主色调
  if (isPureColorSystem) {
    document.documentElement.style.setProperty('--theme-secondary', style.primary);
    document.documentElement.style.setProperty('--theme-accent', style.primary);
    document.documentElement.style.setProperty('--theme-background', style.primary);
    document.documentElement.style.setProperty('--theme-header-bg', style.primary);
    document.documentElement.style.setProperty('--theme-sidebar-bg', style.primary);
  } else {
    // 非纯色系统，使用各自的颜色
    document.documentElement.style.setProperty('--theme-secondary', style.secondary || '#6366f1');
    document.documentElement.style.setProperty('--theme-accent', style.accent || '#8b5cf6');
    
    // 渐变背景应用 - 如果是渐变背景（包含linear-gradient或有次要色调）
    if (style.background.includes('linear-gradient') || style.secondary) {
      document.documentElement.style.setProperty('--theme-background', style.background);
      
      // 总是应用顶部栏渐变 - 确保渐变色正确应用
      const headerGradient = `linear-gradient(90deg, ${style.primary} 0%, ${style.secondary || style.primary} 100%)`;
      document.documentElement.style.setProperty('--theme-header-bg', headerGradient);
      
      // 总是应用侧边栏渐变 - 确保渐变色正确应用
      const sidebarGradient = `linear-gradient(180deg, ${style.primary} 0%, ${style.secondary || style.primary} 100%)`;
      document.documentElement.style.setProperty('--theme-sidebar-bg', sidebarGradient);
    } else {
      // 非渐变背景
      document.documentElement.style.setProperty('--theme-background', style.background || 'linear-gradient(to right, #f0f9ff, #e0f2fe)');
      document.documentElement.style.setProperty('--theme-header-bg', style.primary);
      document.documentElement.style.setProperty('--theme-sidebar-bg', style.secondary || style.primary);
    }
  }
  
  // 辅助颜色可以保持不变
  document.documentElement.style.setProperty('--theme-success', style.success || '#22c55e');
  document.documentElement.style.setProperty('--theme-warning', style.warning || '#eab308');
  document.documentElement.style.setProperty('--theme-error', style.error || '#ef4444');
  document.documentElement.style.setProperty('--theme-info', style.info || '#3b82f6');
  
  // 应用文本和卡片颜色 - 纯色系统需要高对比度文本
  if (isPureColorSystem) {
    // 计算纯色系统文本颜色 - 通常是白色或黑色，取决于背景色的亮度
    const textColor = getContrastColor(style.primary, '#1e293b', '#ffffff');
    document.documentElement.style.setProperty('--theme-text', textColor);
    document.documentElement.style.setProperty('--theme-card', 'rgba(255, 255, 255, 0.1)'); // 半透明卡片
  } else {
    document.documentElement.style.setProperty('--theme-text', style.text || '#1e293b');
    document.documentElement.style.setProperty('--theme-card', style.card || 'rgba(255, 255, 255, 0.8)');
  }
  
  document.documentElement.style.setProperty('--theme-border', '#e2e8f0');
  
  // 应用阴影
  document.documentElement.style.setProperty('--theme-card-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
  document.documentElement.style.setProperty('--theme-button-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)');
  document.documentElement.style.setProperty('--theme-button-hover-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.05)');
  
  // 更新文档根样式
  document.documentElement.style.setProperty('--background', isPureColorSystem ? style.primary : '#ffffff');
  document.documentElement.style.setProperty('--foreground', isPureColorSystem ? getContrastColor(style.primary, '#1e293b', '#ffffff') : (style.text || '#1e293b'));
  
  // 特殊处理纯色系统
  if (isPureColorSystem) {
    // 仅在开发环境输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log('检测到纯色系统，正在应用纯色设置');
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
 * 加载主题从localStorage
 * @param userId 用户ID，用于获取特定用户的主题
 * @returns 存储的主题ID
 */
export function loadThemeFromStorage(userId?: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // 尝试从localStorage获取主题
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error('加载主题偏好失败:', error);
    return null;
  }
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
 * 获取所有可用的主题
 * @param userId 用户ID，用于获取特定用户的自定义主题
 * @returns 主题列表
 */
export function getAllThemes(userId?: string): Array<{id: string, name: string, category: string}> {
  // 重新初始化自定义主题，确保获取最新的用户特定主题
  if (userId) {
    reinitCustomThemes(userId);
  }
  
  // 获取所有预设主题
  const presetThemes = Object.entries(themeDefinitions).map(([id, theme]) => ({
    id,
    name: theme.name || id,
    category: theme.category || '其他'
  }));
  
  // 获取所有自定义主题
  const userCustomThemes = Object.entries(customThemes).map(([id, theme]) => ({
    id,
    name: theme.name || id,
    category: '自定义主题'
  }));
  
  // 合并并返回所有主题
  return [...presetThemes, ...userCustomThemes];
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

/**
 * 同步用户自定义主题
 * 确保用户的自定义主题在浏览器和服务器之间保持同步
 * @param userId 用户ID
 * @param userThemeId 当前用户的主题ID
 */
export function syncCustomThemesForUser(userId: string, userThemeId?: string | null): void {
  if (!userId) return;
  
  console.log(`同步用户 ${userId} 的自定义主题，当前主题ID: ${userThemeId || '无'}`);
  
  // 1. 首先重新加载用户的自定义主题
  reinitCustomThemes(userId);
  
  // 2. 修复所有自定义主题，确保属性完整
  repairCustomThemes(userId);
  
  // 3. 如果当前主题是自定义主题，确保它存在
  if (userThemeId && (userThemeId.startsWith('custom_') || userThemeId === 'custom')) {
    // 确定实际要查找的主题ID
    const actualThemeId = userThemeId === 'custom' ? 
      Object.keys(customThemes).find(id => id.startsWith('custom_')) || userThemeId : 
      userThemeId;
      
    console.log(`检查自定义主题 ${actualThemeId} 是否存在`);
    
    // 检查自定义主题是否存在
    const themeExists = customThemes[actualThemeId];
    
    if (!themeExists) {
      console.warn(`用户 ${userId} 的自定义主题 ${actualThemeId} 不存在，尝试从各种存储中查找`);
      
      // 尝试从各种存储位置查找主题
      let foundTheme = false;
      
      if (typeof window !== 'undefined') {
        try {
          // 1. 检查用户特定存储
          const userThemeKey = getUserThemeKey(userId);
          const userThemes = localStorage.getItem(userThemeKey);
          if (userThemes) {
            const parsedThemes = JSON.parse(userThemes);
            // 检查是否有以custom_开头的主题
            const customThemeKeys = Object.keys(parsedThemes).filter(id => id.startsWith('custom_'));
            if (customThemeKeys.length > 0) {
              // 找到了用户的自定义主题，使用第一个
              const firstCustomTheme = customThemeKeys[0];
              console.log(`在用户存储中找到自定义主题 ${firstCustomTheme}，加载此主题`);
              customThemes[firstCustomTheme] = parsedThemes[firstCustomTheme];
              
              // 如果原始ID是'custom'，也将其映射到找到的主题
              if (userThemeId === 'custom') {
                customThemes['custom'] = parsedThemes[firstCustomTheme];
                console.log(`将'custom'映射到找到的自定义主题 ${firstCustomTheme}`);
              }
              
              foundTheme = true;
            }
          }
          
          // 2. 如果在用户存储中找不到，检查匿名存储
          if (!foundTheme) {
            const defaultThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
            if (defaultThemes) {
              const parsedThemes = JSON.parse(defaultThemes);
              // 尝试直接查找指定的主题
              if (parsedThemes[actualThemeId]) {
                console.log(`在匿名存储中找到自定义主题 ${actualThemeId}`);
                customThemes[actualThemeId] = parsedThemes[actualThemeId];
                // 保存到用户存储
                saveCustomTheme(actualThemeId, parsedThemes[actualThemeId], userId);
                foundTheme = true;
              } else {
                // 找不到指定主题，查找任何自定义主题
                const customThemeKeys = Object.keys(parsedThemes).filter(id => id.startsWith('custom_'));
                if (customThemeKeys.length > 0) {
                  // 使用找到的第一个自定义主题
                  const firstCustomTheme = customThemeKeys[0];
                  console.log(`在匿名存储中找到自定义主题 ${firstCustomTheme}，使用此主题代替 ${actualThemeId}`);
                  customThemes[actualThemeId] = parsedThemes[firstCustomTheme];
                  // 也保存原始主题
                  customThemes[firstCustomTheme] = parsedThemes[firstCustomTheme];
                  // 保存回用户存储
                  saveCustomTheme(actualThemeId, parsedThemes[firstCustomTheme], userId);
                  saveCustomTheme(firstCustomTheme, parsedThemes[firstCustomTheme], userId);
                  foundTheme = true;
                }
              }
            }
          }
        } catch (error) {
          console.error('同步用户自定义主题失败:', error);
        }
      }
      
      if (!foundTheme) {
        console.warn(`无法找到任何自定义主题，将创建新的自定义主题`);
        // 创建一个新的自定义主题并保存
        const newCustomTheme: ThemeStyle = {
          primary: '#3b82f6',
          background: '#f0f7ff',
          card: 'rgba(255, 255, 255, 0.9)',
          text: '#1a202c',
          category: '自定义主题',
          name: '我的自定义主题',
          success: '#48bb78',
          error: '#f56565',
          warning: '#ecc94b',
          info: '#4299e1',
          successLight: 'rgba(72, 187, 120, 0.2)',
          errorLight: 'rgba(245, 101, 101, 0.2)',
          warningLight: 'rgba(236, 201, 75, 0.2)',
          infoLight: 'rgba(66, 153, 225, 0.2)'
        };
        
        // 保存新创建的自定义主题
        saveCustomTheme(actualThemeId, newCustomTheme, userId);
        console.log(`已创建并保存新的自定义主题 ${actualThemeId}`);
      }
    } else {
      console.log(`用户 ${userId} 的自定义主题 ${actualThemeId} 已存在，确保属性完整`);
      // 确保主题属性完整
      if (customThemes[actualThemeId]) {
        // 检查并修复主题属性
        let needsUpdate = false;
        const theme = customThemes[actualThemeId];
        
        // 检查必要属性
        if (!theme.primary) {
          theme.primary = '#3b82f6';
          needsUpdate = true;
        }
        
        // 检查渐变背景
        if (theme.secondary && !theme.background.includes('linear-gradient')) {
          theme.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
          needsUpdate = true;
        }
        
        // 检查分类
        if (!theme.category) {
          theme.category = theme.secondary ? '渐变主题' : '纯色系统';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          console.log(`修复主题 ${actualThemeId} 的属性并保存`);
          saveCustomTheme(actualThemeId, theme, userId);
        }
      }
    }
  }
}

/**
 * 修复自定义主题中可能缺失的属性
 * 检查现有主题并确保所有必要的属性都存在
 * @param userId 用户ID
 */
export function repairCustomThemes(userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log(`开始修复用户 ${userId || '未登录'} 的自定义主题`);
    
    // 获取用户的主题存储键
    const themeKey = getUserThemeKey(userId);
    
    // 读取所有现有主题
    const savedThemes = localStorage.getItem(themeKey);
    if (!savedThemes) {
      console.log(`用户 ${userId || '未登录'} 没有保存的自定义主题`);
      return;
    }
    
    let userThemes: Record<string, ThemeStyle>;
    try {
      userThemes = JSON.parse(savedThemes);
    } catch (error) {
      console.error('解析用户主题失败:', error);
      return;
    }
    
    // 检查每个主题并修复缺失属性
    let hasRepaired = false;
    
    Object.entries(userThemes).forEach(([themeId, theme]) => {
      let needsSave = false;
      
      // 检查必须属性
      if (!theme.primary) {
        console.warn(`主题 ${themeId} 缺少主色调，使用默认值`);
        theme.primary = '#3b82f6';
        needsSave = true;
      }
      
      // 检查并修复渐变背景
      if (theme.secondary && !theme.background.includes('linear-gradient')) {
        console.log(`修复主题 ${themeId} 的渐变背景`);
        theme.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
        theme.category = theme.category || '渐变主题';
        needsSave = true;
      }
      
      // 确保纯色主题设置正确
      if (!theme.secondary && (!theme.background || theme.background === theme.primary)) {
        console.log(`修复主题 ${themeId} 的纯色属性`);
        theme.background = theme.primary;
        theme.category = theme.category || '纯色系统';
        needsSave = true;
      }
      
      // 确保文本颜色正确
      if (!theme.text) {
        console.log(`修复主题 ${themeId} 的文本颜色`);
        theme.text = theme.secondary ? '#1a202c' : getContrastColor(theme.primary, '#1a202c', '#ffffff');
        needsSave = true;
      }
      
      // 确保卡片背景色正确
      if (!theme.card) {
        console.log(`修复主题 ${themeId} 的卡片背景色`);
        theme.card = theme.secondary ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        needsSave = true;
      }
      
      // 确保辅助颜色正确设置
      if (!theme.success) {
        theme.success = '#48bb78';
        needsSave = true;
      }
      if (!theme.error) {
        theme.error = '#f56565';
        needsSave = true;
      }
      if (!theme.warning) {
        theme.warning = '#ecc94b';
        needsSave = true;
      }
      if (!theme.info) {
        theme.info = '#4299e1';
        needsSave = true;
      }
      if (!theme.successLight) {
        theme.successLight = 'rgba(72, 187, 120, 0.2)';
        needsSave = true;
      }
      if (!theme.errorLight) {
        theme.errorLight = 'rgba(245, 101, 101, 0.2)';
        needsSave = true;
      }
      if (!theme.warningLight) {
        theme.warningLight = 'rgba(236, 201, 75, 0.2)';
        needsSave = true;
      }
      if (!theme.infoLight) {
        theme.infoLight = 'rgba(66, 153, 225, 0.2)';
        needsSave = true;
      }
      
      // 修复后更新内存中的主题
      if (needsSave) {
        userThemes[themeId] = theme;
        customThemes[themeId] = theme;
        hasRepaired = true;
      }
    });
    
    // 如果有修复，保存回存储
    if (hasRepaired) {
      localStorage.setItem(themeKey, JSON.stringify(userThemes));
      console.log(`已修复并保存用户 ${userId || '未登录'} 的自定义主题`);
      
      // 如果有用户ID，也更新匿名存储
      if (userId) {
        try {
          // 更新匿名存储中的相应主题
          const anonymousKey = CUSTOM_THEMES_STORAGE_KEY;
          const savedAnonymousThemes = localStorage.getItem(anonymousKey);
          if (savedAnonymousThemes) {
            let anonymousThemes = JSON.parse(savedAnonymousThemes);
            
            // 只更新匿名存储中已存在的主题
            Object.entries(userThemes).forEach(([themeId, theme]) => {
              if (anonymousThemes[themeId]) {
                anonymousThemes[themeId] = theme;
              }
            });
            
            localStorage.setItem(anonymousKey, JSON.stringify(anonymousThemes));
            console.log(`也更新了匿名存储中的相应主题`);
          }
        } catch (error) {
          console.error('更新匿名存储失败:', error);
        }
      }
    } else {
      console.log(`用户 ${userId || '未登录'} 的自定义主题不需要修复`);
    }
    
  } catch (error) {
    console.error('修复自定义主题失败:', error);
  }
} 