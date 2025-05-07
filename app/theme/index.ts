/**
 * 主题配置导出文件
 * 
 * 此文件导出 Ant Design 主题配置及主题服务相关函数
 */

// 导出主题设置的存储键
export const THEME_STORAGE_KEY = 'app-theme-preference';

// 导出Ant主题配置
export { getAntTheme } from './ant-theme'; 

// 导出主题服务功能
export {
  addThemeChangeListener,
  applyTheme,
  createThemeChangeHandler,
  getAllThemes,
  getThemesByCategory,
  getThemeStyle,
  loadThemeFromStorage,
  saveCustomTheme,
  deleteCustomTheme,
  clearCustomThemes,
  reinitCustomThemes,
  syncCustomThemesForUser,
  getContrastColor,
  THEME_CHANGE_EVENT
} from './theme-service';

// 导出主题钩子
export { useTheme } from './useTheme';

// 导出主题组件
export { default as AntThemeProvider } from './AntThemeProvider';

// 导出ThemePanel组件
export { ThemePanel } from './components'; 