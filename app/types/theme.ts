/**
 * 主题类型定义
 * 
 * 这个文件提供统一的主题类型定义，由app/theme/theme-definitions.ts重新导出
 * 目的是为了避免重复的类型定义，确保整个应用使用相同的主题类型
 */

/**
 * 主题样式接口
 * 定义主题的基本样式属性
 */
export interface ThemeStyle {
  /** 主要颜色 - 用于主按钮、链接和重点元素 */
  primary: string;
  /** 次要颜色 - 用于渐变、次要按钮等 */
  secondary?: string;
  /** 背景颜色 - 主要背景 */
  background: string;
  /** 强调色 - 用于高亮和突出显示 */
  accent?: string;
  /** 成功状态颜色 */
  success?: string;
  /** 警告状态颜色 */
  warning?: string;
  /** 错误状态颜色 */
  error?: string;
  /** 信息状态颜色 */
  info?: string;
  /** 文本颜色 */
  text: string;
  /** 次要文本颜色 */
  textSecondary?: string;
  /** 禁用状态文本颜色 */
  textDisabled?: string;
  /** 边框颜色 */
  border?: string;
  /** 主题分类 - 用于主题面板中的归类 */
  category?: string;
  /** 主题名称 - 展示给用户的名称 */
  name?: string;
  /** 主题ID - 用于存储和引用 */
  id?: string;
  /** 主题类型 - 预设或自定义 */
  type?: 'preset' | 'custom';
  /** 自定义属性 - 允许扩展其他属性 */
  [key: string]: string | undefined;
} 