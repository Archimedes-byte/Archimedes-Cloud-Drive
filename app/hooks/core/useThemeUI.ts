import { useState, useCallback } from 'react';
import { useThemeManager, ThemeManagerHook } from './useThemeManager';

/**
 * 主题UI管理Hook
 * 管理主题相关UI状态，如主题面板的显示/隐藏
 */
export function useThemeUI(themeManagerProps?: Parameters<typeof useThemeManager>[0]) {
  // 主题面板显示状态
  const [showThemePanel, setShowThemePanel] = useState(false);
  
  // 使用主题管理hook
  const themeManager = useThemeManager(themeManagerProps || {});
  
  /**
   * 切换主题面板显示状态
   */
  const toggleThemePanel = useCallback(() => {
    setShowThemePanel(prev => !prev);
  }, []);
  
  /**
   * 打开主题面板
   */
  const openThemePanel = useCallback(() => {
    setShowThemePanel(true);
  }, []);
  
  /**
   * 关闭主题面板
   */
  const closeThemePanel = useCallback(() => {
    setShowThemePanel(false);
  }, []);
  
  return {
    // 从themeManager获取的状态和方法
    ...themeManager,
    
    // 主题面板状态
    showThemePanel,
    
    // 设置器
    setShowThemePanel,
    
    // 主题面板操作
    toggleThemePanel,
    openThemePanel,
    closeThemePanel
  };
} 