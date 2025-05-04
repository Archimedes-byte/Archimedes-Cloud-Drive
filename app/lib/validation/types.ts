/**
 * 验证规则类型定义
 */

// 验证器函数类型
export type Validator<T = any> = (value: T, ...args: any[]) => boolean;

// 错误消息模板类型
export type ErrorMessageTemplate = string | ((params: Record<string, any>) => string);

// 验证规则配置
export interface ValidationRuleConfig {
  name: string;
  validator: Validator;
  message: ErrorMessageTemplate;
}

// 支持的语言
export type SupportedLanguage = 'zh-CN' | 'en-US';

// 语言消息包
export interface LanguageMessages {
  [key: string]: ErrorMessageTemplate;
}

// 验证字段值的返回结果
export interface ValidationResult {
  isValid: boolean;
  message: string;
} 