/**
 * Ant Design 全局主题配置
 * 
 * 此文件集中管理所有 Ant Design 组件的主题配置
 * 可以在应用根组件中使用 ConfigProvider 应用此主题
 */

import { ThemeConfig } from 'antd';
import { getThemeStyle } from './theme-service';
import { ThemeStyle } from './theme-definitions';

/**
 * 根据当前主题样式生成Ant Design主题配置
 * @param themeStyle 当前主题样式
 * @returns Ant Design主题配置
 */
export function getAntTheme(themeStyle?: ThemeStyle): ThemeConfig {
  // 如果没有提供主题样式，使用当前应用的主题
  const theme = themeStyle || getThemeStyle();
  
  // 使用默认颜色
  const backgroundColor = '#ffffff';
  const textColor = theme.text || '#1a202c';
  
  return {
    token: {
      // 颜色 - 动态使用主题系统的值
      colorPrimary: theme.primary,
      colorSuccess: theme.success || '#10b981',
      colorWarning: theme.warning || '#f59e0b',
      colorError: theme.error || '#ef4444',
      colorInfo: theme.info || theme.primary,
      
      // 基础颜色
      colorBgBase: backgroundColor,
      colorTextBase: textColor,
      
      // 尺寸与字体
      borderRadius: 6,
      fontSize: 14,
      
      // 阴影
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      boxShadowSecondary: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    components: {
      Button: {
        primaryColor: theme.primary,
        defaultBorderColor: '#e5e7eb',
        defaultColor: '#4b5563',
        defaultBg: '#f3f4f6',
        borderRadius: 6,
        controlHeight: 40,
      },
      Input: {
        controlHeight: 40,
        borderRadius: 6,
        colorBorder: '#e2e8f0',
      },
      Select: {
        controlHeight: 40,
        borderRadius: 6,
        colorBorder: '#e2e8f0',
      },
      Card: {
        colorBorderSecondary: '#e2e8f0',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)',
      },
      Table: {
        borderRadius: 8,
        headerBg: '#f8fafc',
        headerColor: '#475569',
        rowHoverBg: '#f1f5f9',
        colorBorderSecondary: '#e2e8f0',
      },
      Modal: {
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      Menu: {
        colorItemBg: 'transparent',
        colorItemText: '#64748b',
        colorItemTextSelected: theme.primary,
        colorItemBgSelected: `rgba(${hexToRgb(theme.primary)}, 0.08)`,
        colorItemTextHover: theme.secondary || darkenColor(theme.primary, 20),
      },
      Tabs: {
        colorBorderSecondary: '#e2e8f0',
        colorPrimary: theme.primary,
      },
    },
  };
}

/**
 * 将十六进制颜色转换为RGB
 * @param hex 十六进制颜色
 * @returns RGB颜色值（不带rgba前缀）
 */
function hexToRgb(hex: string): string {
  // 移除#号
  const cleanHex = hex.replace('#', '');
  
  // 处理简写形式，如#abc => #aabbcc
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
    
  // 解析RGB值
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * 使颜色变暗
 * @param hex 十六进制颜色
 * @param percent 变暗百分比
 * @returns 变暗后的颜色
 */
function darkenColor(hex: string, percent: number): string {
  // 移除#号
  const cleanHex = hex.replace('#', '');
  
  // 处理简写形式
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
    
  // 解析RGB值
  let r = parseInt(fullHex.substring(0, 2), 16);
  let g = parseInt(fullHex.substring(2, 4), 16);
  let b = parseInt(fullHex.substring(4, 6), 16);
  
  // 使颜色变暗
  r = Math.max(0, Math.floor(r * (100 - percent) / 100));
  g = Math.max(0, Math.floor(g * (100 - percent) / 100));
  b = Math.max(0, Math.floor(b * (100 - percent) / 100));
  
  // 转回十六进制
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 导出默认主题配置
export default getAntTheme(); 