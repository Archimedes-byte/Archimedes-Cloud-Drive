/**
 * 主题提供器
 * 提供全局主题Context和Ant Design主题配置
 */
import React, { ReactNode, createContext, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN'; // 导入中文语言包
import { useTheme, ThemeHook } from './useTheme';
import { ThemeStyle } from '@/app/types/theme';

// 创建主题上下文
export const ThemeContext = createContext<ThemeHook | null>(null);

// 辅助函数：将主题样式转换为Ant Design主题令牌
function convertThemeToAntTokens(theme: ThemeStyle | null) {
  if (!theme) {
    return {};
  }

  return {
    colorPrimary: theme.primary,
    colorLink: theme.primary,
    colorSuccess: theme.success || '#22c55e',
    colorWarning: theme.warning || '#eab308',
    colorError: theme.error || '#ef4444',
    colorInfo: theme.info || theme.primary,
    colorTextBase: theme.text || '#1a202c',
    colorBgBase: theme.card || 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
  };
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  userTheme?: string | null;
  disableApiSync?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'default',
  userTheme = null,
  disableApiSync = false,
}: ThemeProviderProps) {
  // 使用主题钩子
  const themeManager = useTheme({
    defaultTheme,
    userTheme,
    disableApiSync,
  });

  // 创建Ant Design的主题配置
  const antDesignTheme = useMemo(() => {
    const tokens = convertThemeToAntTokens(themeManager.themeStyle);

    return {
      algorithm: [antTheme.defaultAlgorithm],
      token: tokens,
      components: {
        Button: {
          borderRadius: 8,
          paddingInline: 16,
        },
        Input: {
          borderRadius: 8,
        },
        Select: {
          borderRadius: 8,
        },
        Modal: {
          borderRadius: 12,
        },
        Card: {
          borderRadius: 12,
        },
        Table: {
          borderRadius: 8,
        },
      },
    };
  }, [themeManager.themeStyle]);

  // 注入初始主题脚本以避免主题闪烁
  useEffect(() => {
    if (typeof document !== 'undefined' && themeManager.currentTheme) {
      document.body.dataset.theme = themeManager.currentTheme;
    }
  }, [themeManager.currentTheme]);

  return (
    <ThemeContext.Provider value={themeManager}>
      <ConfigProvider theme={antDesignTheme} locale={zhCN}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
} 