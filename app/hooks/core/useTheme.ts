/**
 * 主题Hook - 重定向模块
 * 
 * 此模块将所有导入重定向到 app/theme/useTheme.ts
 */

export { 
  useTheme, 
  type ThemeHook, 
  type UseThemeProps 
} from '@/app/theme/useTheme';

// 重导出theme-service中的常用函数
export { 
  getAllThemes,
  getThemesByCategory,
  getThemeStyle
} from '@/app/theme/theme-service'; 