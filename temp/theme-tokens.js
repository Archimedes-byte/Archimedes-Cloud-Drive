"use strict";
/**
 * 主题令牌定义
 *
 * 定义应用中使用的所有主题令牌（Theme Tokens）
 * 这些令牌用于构建一致的设计系统
 *
 * 此文件是应用中所有主题定义的唯一源
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkThemeTokens = exports.lightThemeTokens = void 0;
const base_colors_1 = require("./base-colors");
// 导出默认亮色主题令牌
exports.lightThemeTokens = {
    // 主色调
    themePrimary: base_colors_1.baseColors.blue[500],
    themePrimaryLight: base_colors_1.baseColors.blue[400],
    themePrimaryDark: base_colors_1.baseColors.blue[600],
    themeSecondary: base_colors_1.baseColors.blue[800],
    themeSecondaryLight: base_colors_1.baseColors.blue[300],
    themeSecondaryDark: base_colors_1.baseColors.blue[900],
    themeAccent: base_colors_1.baseColors.blue[400],
    // 状态色
    themeSuccess: base_colors_1.baseColors.green[500],
    themeSuccessLight: base_colors_1.baseColors.green[500] + '20', // 透明度20%
    themeSuccessDark: base_colors_1.baseColors.green[600],
    themeWarning: base_colors_1.baseColors.yellow[500],
    themeWarningLight: base_colors_1.baseColors.yellow[500] + '20', // 透明度20%
    themeWarningDark: base_colors_1.baseColors.yellow[600],
    themeError: base_colors_1.baseColors.red[500],
    themeErrorLight: base_colors_1.baseColors.red[500] + '20', // 透明度20%
    themeErrorDark: base_colors_1.baseColors.red[600],
    themeInfo: base_colors_1.baseColors.blue[500],
    themeInfoLight: base_colors_1.baseColors.blue[500] + '20', // 透明度20%
    themeInfoDark: base_colors_1.baseColors.blue[600],
    // 文本颜色
    themeText: base_colors_1.baseColors.gray[800],
    themeTextSecondary: base_colors_1.baseColors.gray[600],
    themeTextTertiary: base_colors_1.baseColors.gray[400],
    // 背景颜色
    themeBackground: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)',
    themeBackgroundSolid: '#ffffff',
    themeBackgroundSecondary: base_colors_1.baseColors.gray[50],
    themeCard: 'rgba(255, 255, 255, 0.9)',
    // 边框颜色
    themeBorder: base_colors_1.baseColors.gray[200],
    themeBorderLight: base_colors_1.baseColors.gray[100],
    // 阴影
    themeCardShadow: '0 10px 30px rgba(59, 130, 246, 0.1)',
    themeButtonShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
    themeButtonHoverShadow: '0 6px 16px rgba(59, 130, 246, 0.3)',
    themeDropdownShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    // 过渡
    transitionSpeed: '0.3s',
    transitionFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // 尺寸
    borderRadius: '0.5rem',
    inputHeight: '2.5rem',
    buttonHeight: '2.5rem',
};
// 导出暗色模式主题令牌
exports.darkThemeTokens = {
    // 主色调
    themePrimary: base_colors_1.baseColors.blue[400],
    themePrimaryLight: base_colors_1.baseColors.blue[300],
    themePrimaryDark: base_colors_1.baseColors.blue[500],
    themeSecondary: base_colors_1.baseColors.blue[500],
    themeSecondaryLight: base_colors_1.baseColors.blue[400],
    themeSecondaryDark: base_colors_1.baseColors.blue[600],
    themeAccent: base_colors_1.baseColors.blue[300],
    // 状态色 - 暗色模式下使用更亮的颜色
    themeSuccess: '#34d399',
    themeSuccessLight: '#34d39920', // 透明度20%
    themeSuccessDark: base_colors_1.baseColors.green[500],
    themeWarning: '#fbbf24',
    themeWarningLight: '#fbbf2420', // 透明度20%
    themeWarningDark: base_colors_1.baseColors.yellow[500],
    themeError: '#f87171',
    themeErrorLight: '#f8717120', // 透明度20%
    themeErrorDark: base_colors_1.baseColors.red[500],
    themeInfo: base_colors_1.baseColors.blue[400],
    themeInfoLight: base_colors_1.baseColors.blue[400] + '20', // 透明度20%
    themeInfoDark: base_colors_1.baseColors.blue[500],
    // 文本颜色
    themeText: '#f1f5f9',
    themeTextSecondary: '#94a3b8',
    themeTextTertiary: '#64748b',
    // 背景颜色
    themeBackground: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    themeBackgroundSolid: '#0f172a',
    themeBackgroundSecondary: '#1e293b',
    themeCard: 'rgba(30, 41, 59, 0.9)',
    // 边框颜色
    themeBorder: '#334155',
    themeBorderLight: '#1e293b',
    // 阴影
    themeCardShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    themeButtonShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    themeButtonHoverShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
    themeDropdownShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    // 过渡
    transitionSpeed: '0.3s',
    transitionFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // 尺寸
    borderRadius: '0.5rem',
    inputHeight: '2.5rem',
    buttonHeight: '2.5rem',
};
exports.default = exports.lightThemeTokens;
