import { ThemeConfig } from 'antd';

// 提取自globals.css中的原始变量
export const themeTokens = {
  // 主题颜色
  themePrimary: '#3b82f6',
  themeSecondary: '#2c5282',
  themeAccent: '#60a5fa',
  themeSuccess: '#10b981',
  themeWarning: '#f59e0b',
  themeError: '#ef4444',
  themeInfo: '#3b82f6',
  
  // 背景和界面
  themeBackground: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)',
  themeCard: 'rgba(255, 255, 255, 0.9)',
  themeBorder: '#e2e8f0',
  themeText: '#1a202c',
  
  // 阴影
  themeCardShadow: '0 10px 30px rgba(59, 130, 246, 0.1)',
  themeButtonShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
  themeButtonHoverShadow: '0 6px 16px rgba(59, 130, 246, 0.3)',
  
  // 过渡速度
  transitionSpeed: '0.3s',
};

// Ant Design主题配置
export const theme: ThemeConfig = {
  token: {
    // 基础颜色系统
    colorPrimary: themeTokens.themePrimary,
    colorInfo: themeTokens.themeInfo,
    colorSuccess: themeTokens.themeSuccess,
    colorWarning: themeTokens.themeWarning,
    colorError: themeTokens.themeError,
    colorTextBase: themeTokens.themeText,
    
    // 圆角
    borderRadius: 8,
    
    // 字体
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    
    // 过渡
    motionDurationMid: '0.3s',
    
    // 线条颜色
    colorBorder: themeTokens.themeBorder,
    
    // 阴影
    boxShadow: themeTokens.themeCardShadow,
  },
  components: {
    Button: {
      colorPrimary: themeTokens.themePrimary,
      algorithm: true,
      boxShadow: themeTokens.themeButtonShadow,
      borderRadius: 8,
    },
    Card: {
      colorBgContainer: themeTokens.themeCard,
      boxShadow: themeTokens.themeCardShadow,
      borderRadius: 12,
    },
    Table: {
      borderRadius: 12,
      colorBgContainer: 'white',
      fontWeightStrong: 600,
    },
    Input: {
      activeBorderColor: themeTokens.themePrimary,
      hoverBorderColor: themeTokens.themePrimary,
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 12,
    },
  },
}; 