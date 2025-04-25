/**
 * Ant Design 全局主题配置
 * 
 * 此文件集中管理所有 Ant Design 组件的主题配置
 * 可以在应用根组件中使用 ConfigProvider 应用此主题
 */

import { ThemeConfig } from 'antd';

// 这里的颜色与我们的自定义CSS保持一致
export const customTheme: ThemeConfig = {
  token: {
    // 颜色
    colorPrimary: '#3b82f6', // 主题色
    colorSuccess: '#10b981', // 成功色
    colorWarning: '#f59e0b', // 警告色
    colorError: '#ef4444', // 错误色
    colorInfo: '#3b82f6', // 信息色
    
    // 尺寸与字体
    borderRadius: 6,
    fontSize: 14,
    
    // 阴影
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Button: {
      primaryColor: '#3b82f6',
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
      colorItemTextSelected: '#3b82f6',
      colorItemBgSelected: 'rgba(59, 130, 246, 0.08)',
      colorItemTextHover: '#1e40af',
    },
    Tabs: {
      colorBorderSecondary: '#e2e8f0',
      colorPrimary: '#3b82f6',
    },
  },
};

export default customTheme; 