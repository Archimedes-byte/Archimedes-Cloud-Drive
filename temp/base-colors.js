"use strict";
/**
 * 基础颜色定义
 *
 * 定义应用中使用的所有基础颜色
 * 这些颜色用于构建主题令牌
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseColors = void 0;
// 基础颜色变量 - 用于构建其他主题变量
exports.baseColors = {
    // 主色调
    blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
    green: {
        500: '#10b981',
        600: '#059669',
    },
    yellow: {
        500: '#f59e0b',
        600: '#d97706',
    },
    red: {
        500: '#ef4444',
        600: '#dc2626',
    },
};
exports.default = exports.baseColors;
