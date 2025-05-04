/**
 * 基础验证器函数
 */
import { Validator } from './types';

/**
 * 必填验证
 */
export const required: Validator = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * 电子邮箱验证
 */
export const email: Validator = (value: string): boolean => {
  if (!value) return true; // 允许空值，除非与required组合使用
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * 最小长度验证
 */
export const min = (minLength: number): Validator => {
  return (value: string): boolean => {
    if (!value) return true; // 允许空值，除非与required组合使用
    return value.length >= minLength;
  };
};

/**
 * 最大长度验证
 */
export const max = (maxLength: number): Validator => {
  return (value: string): boolean => {
    if (!value) return true;
    return value.length <= maxLength;
  };
};

/**
 * 最小数值验证
 */
export const minNumber = (min: number): Validator => {
  return (value: number | string): boolean => {
    if (value === '' || value === undefined || value === null) return true;
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(numberValue) && numberValue >= min;
  };
};

/**
 * 最大数值验证
 */
export const maxNumber = (max: number): Validator => {
  return (value: number | string): boolean => {
    if (value === '' || value === undefined || value === null) return true;
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(numberValue) && numberValue <= max;
  };
};

/**
 * 密码匹配验证
 */
export const passwordMatch = (compareField: string): Validator => {
  return (value: string, allValues?: Record<string, any>): boolean => {
    if (!value || !allValues) return true;
    return value === allValues[compareField];
  };
};

/**
 * 密码强度验证
 */
export const passwordStrength: Validator = (value: string): boolean => {
  if (!value) return true;
  
  // 至少包含以下条件中的三个：
  // 1. 大写字母
  // 2. 小写字母
  // 3. 数字
  // 4. 特殊字符
  
  let score = 0;
  if (/[A-Z]/.test(value)) score++; // 大写字母
  if (/[a-z]/.test(value)) score++; // 小写字母
  if (/[0-9]/.test(value)) score++; // 数字
  if (/[^A-Za-z0-9]/.test(value)) score++; // 特殊字符
  
  return score >= 3 && value.length >= 8;
};

/**
 * 手机号码验证
 */
export const mobilePhone: Validator = (value: string): boolean => {
  if (!value) return true;
  // 简单的手机号码验证（中国大陆）
  return /^1[3-9]\d{9}$/.test(value);
};

/**
 * URL地址验证
 */
export const url: Validator = (value: string): boolean => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 整数验证
 */
export const integer: Validator = (value: string | number): boolean => {
  if (value === '' || value === undefined || value === null) return true;
  if (typeof value === 'number') return Number.isInteger(value);
  return /^-?\d+$/.test(value);
};

/**
 * 数字验证
 */
export const float: Validator = (value: string | number): boolean => {
  if (value === '' || value === undefined || value === null) return true;
  if (typeof value === 'number') return !isNaN(value);
  return /^-?\d+(\.\d+)?$/.test(value);
};

/**
 * 日期验证
 */
export const date: Validator = (value: string): boolean => {
  if (!value) return true;
  const timestamp = Date.parse(value);
  return !isNaN(timestamp);
};

/**
 * 正则表达式验证
 */
export const pattern = (regex: RegExp): Validator => {
  return (value: string): boolean => {
    if (!value) return true;
    return regex.test(value);
  };
}; 