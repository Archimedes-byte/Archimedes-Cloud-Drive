// 定义主题接口
export interface ThemeStyle {
  primary: string;
  secondary: string;
  accent?: string;
  background: string;
  card?: string;
  text?: string;
  name?: string;
  category?: string;
  
  // 字体设置
  fontFamily?: string;
  
  // 状态颜色
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  
  // 状态颜色浅色版本
  successLight?: string;
  errorLight?: string;
  warningLight?: string;
  infoLight?: string;
}

/**
 * 基础主题模板
 * 包含所有主题通用的默认值
 */
const baseThemeTemplate: Partial<ThemeStyle> = {
  // 通用默认值
  card: 'rgba(255, 255, 255, 0.9)',
  text: '#1a202c',
  
  // 状态颜色
  success: '#48bb78',
  error: '#f56565',
  warning: '#ecc94b',
  info: '#4299e1',
  
  // 状态颜色浅色版
  successLight: 'rgba(72, 187, 120, 0.2)',
  errorLight: 'rgba(245, 101, 101, 0.2)',
  warningLight: 'rgba(236, 201, 75, 0.2)',
  infoLight: 'rgba(66, 153, 225, 0.2)'
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
function createTheme(
  name: string,
  colors: {
    primary: string;
    secondary: string;
    accent: string;
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
    ...overrides
  };
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
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)'
    },
    '基础色彩'
  ),
  
  violet: createTheme(
    '梦幻紫',
    {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      accent: '#c4b5fd',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
    },
    '基础色彩'
  ),
  
  emerald: createTheme(
    '自然绿',
    {
      primary: '#10b981',
      secondary: '#047857',
      accent: '#6ee7b7',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
    },
    '基础色彩'
  ),
  
  amber: createTheme(
    '温暖橙',
    {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fcd34d',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
    },
    '基础色彩'
  ),
  
  rose: createTheme(
    '浪漫粉',
    {
      primary: '#f43f5e',
      secondary: '#e11d48',
      accent: '#fda4af',
      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
    },
    '基础色彩'
  ),
  
  // 渐变主题
  ocean: createTheme(
    '深海蓝',
    {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
    },
    '渐变主题'
  ),
  
  sunset: createTheme(
    '日落',
    {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fb923c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
    },
    '渐变主题'
  ),
  
  forest: createTheme(
    '森林',
    {
      primary: '#16a34a',
      secondary: '#15803d',
      accent: '#22c55e',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
    },
    '渐变主题'
  ),
  
  galaxy: createTheme(
    '星空',
    {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#818cf8',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'
    },
    '渐变主题'
  ),
  
  // 季节主题
  spring: createTheme(
    '春日',
    {
      primary: '#ec4899',
      secondary: '#db2777',
      accent: '#f472b6',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)'
    },
    '季节主题'
  ),
  
  summer: createTheme(
    '盛夏',
    {
      primary: '#eab308',
      secondary: '#ca8a04',
      accent: '#facc15',
      background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)'
    },
    '季节主题'
  ),
  
  autumn: createTheme(
    '金秋',
    {
      primary: '#b45309',
      secondary: '#92400e',
      accent: '#f59e0b',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
    },
    '季节主题'
  ),
  
  winter: createTheme(
    '冬雪',
    {
      primary: '#0369a1',
      secondary: '#075985',
      accent: '#38bdf8',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    },
    '季节主题'
  ),
  
  // 柔和主题 - 浅色系列
  pastel_pink: createTheme(
    '粉彩洋',
    {
      primary: '#f9a8d4',
      secondary: '#ec4899',
      accent: '#fbcfe8',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
    },
    '柔和主题'
  ),
  
  pastel_blue: createTheme(
    '天空蓝',
    {
      primary: '#93c5fd',
      secondary: '#60a5fa',
      accent: '#bfdbfe',
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
    },
    '柔和主题'
  ),

  // 续接其他主题...
  pastel_lavender: createTheme(
    '薰衣草',
    {
      primary: '#c4b5fd',
      secondary: '#8b5cf6',
      accent: '#ddd6fe',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
    },
    '柔和主题'
  )
  
  // 其他主题可以按需继续添加...
};

// 主题分类
export const themeCategories = {
  '基础色彩': ['default', 'violet', 'emerald', 'amber', 'rose'],
  '渐变主题': ['ocean', 'sunset', 'forest', 'galaxy'],
  '季节主题': ['spring', 'summer', 'autumn', 'winter'],
  '柔和主题': ['pastel_pink', 'pastel_blue', 'pastel_lavender'],
}; 