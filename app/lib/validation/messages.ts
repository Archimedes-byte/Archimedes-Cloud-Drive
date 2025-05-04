/**
 * 验证错误消息模板
 */
import { LanguageMessages, SupportedLanguage, ErrorMessageTemplate } from './types';

// 中文错误消息
const zhCN: LanguageMessages = {
  required: '请输入{{label}}',
  email: '请输入有效的电子邮箱地址',
  min: '{{label}}不能少于{{min}}个字符',
  max: '{{label}}不能超过{{max}}个字符',
  minNumber: '{{label}}不能小于{{min}}',
  maxNumber: '{{label}}不能大于{{max}}',
  passwordMatch: '两次输入的密码不一致',
  passwordStrength: '密码至少需要包含大小写字母、数字和特殊字符',
  mobilePhone: '请输入有效的手机号码',
  url: '请输入有效的URL地址',
  integer: '请输入整数',
  float: '请输入有效的数字',
  date: '请输入有效的日期',
  pattern: '{{label}}格式不正确'
};

// 英文错误消息
const enUS: LanguageMessages = {
  required: 'Please enter {{label}}',
  email: 'Please enter a valid email address',
  min: '{{label}} cannot be less than {{min}} characters',
  max: '{{label}} cannot exceed {{max}} characters',
  minNumber: '{{label}} cannot be less than {{min}}',
  maxNumber: '{{label}} cannot be greater than {{max}}',
  passwordMatch: 'The two passwords do not match',
  passwordStrength: 'Password must contain uppercase and lowercase letters, numbers, and special characters',
  mobilePhone: 'Please enter a valid mobile phone number',
  url: 'Please enter a valid URL',
  integer: 'Please enter an integer',
  float: 'Please enter a valid number',
  date: 'Please enter a valid date',
  pattern: '{{label}} format is incorrect'
};

// 语言消息包
const messages: Record<SupportedLanguage, LanguageMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS
};

// 当前语言（默认中文）
let currentLanguage: SupportedLanguage = 'zh-CN';

/**
 * 设置当前语言
 */
export function setLanguage(language: SupportedLanguage): void {
  if (messages[language]) {
    currentLanguage = language;
  }
}

/**
 * 获取消息模板
 */
export function getMessageTemplate(key: string): ErrorMessageTemplate {
  return messages[currentLanguage][key] || messages['zh-CN'][key] || key;
}

/**
 * 格式化消息
 */
export function formatMessage(template: string, params: Record<string, any> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? params[key] : `{{${key}}}`;
  });
}

/**
 * 构建错误消息
 */
export function buildErrorMessage(key: string, params: Record<string, any> = {}): string {
  const template = getMessageTemplate(key);
  if (typeof template === 'function') {
    return template(params);
  }
  return formatMessage(template, params);
} 