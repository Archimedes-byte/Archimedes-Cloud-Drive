/**
 * 主题定义模块
 * 
 * 定义主题预设和创建函数
 */

// 导入统一的ThemeStyle类型
import { ThemeStyle } from '@/app/types/theme';

/**
 * 基础主题模板
 * 包含所有主题通用的默认值
 */
const baseThemeTemplate: Partial<ThemeStyle> = {
  // 通用默认值
  text: '#1a202c',
  
  // 状态颜色
  success: '#48bb78',
  error: '#f56565',
  warning: '#ecc94b',
  info: '#4299e1',
  
  // 次要文本颜色
  textSecondary: '#4a5568',
  textDisabled: '#a0aec0',
  
  // 边框颜色
  border: '#e2e8f0',
};

/**
 * 主题工厂函数
 * 创建标准化的主题对象，减少重复代码
 * 
 * @param name 主题名称
 * @param colors 主题主要颜色配置
 * @param category 主题类别
 * @param overrides 其他覆盖属性
 * @returns 完整的主题对象
 */
export function createTheme(
  name: string,
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background: string;
  },
  category: string = '基础色彩',
  overrides: Partial<ThemeStyle> = {}
): ThemeStyle {
  return {
    ...baseThemeTemplate,
    name,
    category,
    ...colors,
    ...overrides,
    type: 'preset',
  } as ThemeStyle;
}

// 定义所有可用主题
export const themeDefinitions: Record<string, ThemeStyle> = {
  // 基础色彩主题
  default: createTheme(
    '默认蓝', 
    {
      primary: '#3b82f6',
      secondary: '#2c5282',
      accent: '#60a5fa',
      background: 'linear-gradient(135deg, #f8faff 0%, #e6f0fd 100%)',
    },
    '基础色彩'
  ),
  
  // 添加一个纯色系统主题
  pure_blue: createTheme(
    '纯蓝', 
    {
      primary: '#3b82f6',
      background: '#f0f7ff',
    },
    '纯色系统'
  ),
  
  pure_red: createTheme(
    '纯红', 
    {
      primary: '#ef4444',
      background: '#fff5f5',
    },
    '纯色系统'
  ),
  
  pure_green: createTheme(
    '纯绿', 
    {
      primary: '#10b981',
      background: '#f0fff4',
    },
    '纯色系统'
  ),
  
  violet: createTheme(
    '梦幻紫',
    {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#c4b5fd',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    },
    '基础色彩'
  ),
  
  emerald: createTheme(
    '自然绿',
    {
      primary: '#10b981',
      secondary: '#047857',
      accent: '#6ee7b7',
      background: 'linear-gradient(135deg, #f0fff4 0%, #d1fae5 100%)',
    },
    '基础色彩'
  ),
  
  amber: createTheme(
    '温暖橙',
    {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fcd34d',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    },
    '基础色彩'
  ),
  
  rose: createTheme(
    '浪漫粉',
    {
      primary: '#f43f5e',
      secondary: '#e11d48',
      accent: '#fda4af',
      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    },
    '基础色彩'
  ),
  
  // 深色主题
  dark: createTheme(
    '深色主题',
    {
      primary: '#60a5fa',
      secondary: '#93c5fd',
      accent: '#3b82f6',
      background: '#1e293b',
    },
    '深色主题',
    {
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      textDisabled: '#94a3b8',
      border: '#334155',
    }
  ),
  
  // 季节主题
  spring: createTheme(
    '春日',
    {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#f472b6',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)',
    },
    '季节主题'
  ),
  
  summer: createTheme(
    '盛夏',
    {
      primary: '#eab308',
      secondary: '#ca8a04',
      accent: '#facc15',
      background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
    },
    '季节主题'
  ),
  
  autumn: createTheme(
    '秋意',
    {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    },
    '季节主题'
  ),
  
  winter: createTheme(
    '冬雪',
    {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
    },
    '季节主题'
  ),
}; 