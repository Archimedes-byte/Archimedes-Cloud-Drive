/**
 * 预定义验证规则
 * 
 * 提供常用验证规则的预配置
 */
import { ValidationRule } from '@/app/lib/forms/types';
import * as validators from './validators';
import { buildErrorMessage } from './messages';

/**
 * 必填验证规则
 */
export const required = (label = '此项'): ValidationRule => ({
  validator: validators.required,
  message: buildErrorMessage('required', { label })
});

/**
 * 电子邮箱验证规则
 */
export const email: ValidationRule = {
  validator: validators.email,
  message: buildErrorMessage('email')
};

/**
 * 最小长度验证规则
 */
export const min = (minLength: number, label = '此项'): ValidationRule => ({
  validator: validators.min(minLength),
  message: buildErrorMessage('min', { label, min: minLength })
});

/**
 * 最大长度验证规则
 */
export const max = (maxLength: number, label = '此项'): ValidationRule => ({
  validator: validators.max(maxLength),
  message: buildErrorMessage('max', { label, max: maxLength })
});

/**
 * 数值范围验证规则
 */
export const minNumber = (min: number, label = '此项'): ValidationRule => ({
  validator: validators.minNumber(min),
  message: buildErrorMessage('minNumber', { label, min })
});

/**
 * 最大数值验证规则
 */
export const maxNumber = (max: number, label = '此项'): ValidationRule => ({
  validator: validators.maxNumber(max),
  message: buildErrorMessage('maxNumber', { label, max })
});

/**
 * 密码匹配验证规则
 */
export const passwordMatch = (compareField: string): ValidationRule => ({
  validator: validators.passwordMatch(compareField),
  message: buildErrorMessage('passwordMatch')
});

/**
 * 密码强度验证规则
 */
export const passwordStrength: ValidationRule = {
  validator: validators.passwordStrength,
  message: buildErrorMessage('passwordStrength')
};

/**
 * 手机号码验证规则
 */
export const mobilePhone: ValidationRule = {
  validator: validators.mobilePhone,
  message: buildErrorMessage('mobilePhone')
};

/**
 * URL地址验证规则
 */
export const url: ValidationRule = {
  validator: validators.url,
  message: buildErrorMessage('url')
};

/**
 * 整数验证规则
 */
export const integer: ValidationRule = {
  validator: validators.integer,
  message: buildErrorMessage('integer')
};

/**
 * 数字验证规则
 */
export const float: ValidationRule = {
  validator: validators.float,
  message: buildErrorMessage('float')
};

/**
 * 日期验证规则
 */
export const date: ValidationRule = {
  validator: validators.date,
  message: buildErrorMessage('date')
};

/**
 * 正则表达式验证规则
 */
export const pattern = (regex: RegExp, label = '此项'): ValidationRule => ({
  validator: validators.pattern(regex),
  message: buildErrorMessage('pattern', { label })
}); 