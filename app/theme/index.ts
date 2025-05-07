/**
 * 主题系统
 * 
 * 集中导出所有主题相关功能
 * 提供统一的API和更好的性能和维护性
 */

// 导出主题服务功能
export {
  // 基础常量
  THEME_STORAGE_KEY,
  THEME_CHANGE_EVENT,
  CUSTOM_THEMES_STORAGE_KEY,
  // 基础功能
  applyTheme,
  getThemeStyle,
  getAllThemes,
  getThemesByCategory,
  // 存储功能
  loadThemeFromStorage,
  saveCustomTheme,
  deleteCustomTheme,
  // 事件监听
  addThemeChangeListener,
  // 自定义主题
  initCustomThemes,
  reinitCustomThemes,
  syncCustomThemesForUser,
  // 工具函数
  getContrastColor,
  getUserThemeKey
} from './theme-service';

// 导出主题定义
export {
  themeDefinitions,
  createTheme
} from './theme-definitions';

// 引入需要导出的组件和钩子
import { useTheme, type ThemeHook } from './useTheme';
import { ThemeProvider, ThemeContext } from './ThemeProvider';
import { ThemePanel } from './components';
import type { ThemeStyle } from '@/app/types/theme';

// 导出主题系统组件和钩子
export { useTheme, ThemeProvider, ThemeContext, ThemePanel };
export type { ThemeHook, ThemeStyle }; 