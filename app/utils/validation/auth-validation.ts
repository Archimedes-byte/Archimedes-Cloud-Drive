'use client';

/**
 * 认证验证工具
 * 
 * 提供前端表单验证功能，确保与后端验证一致
 */
import { LoginCredentials, RegisterData } from '@/app/types';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
import { 
  emailSchema, 
  passwordSchema, 
  nameSchema,
  loginSchema,
  registerSchema
} from '@/app/lib/validation/schemas';

/**
 * 邮箱验证正则表达式
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * 登录表单验证
 * 
 * 使用与后端一致的验证规则
 */
export const validateLoginForm = (values: LoginCredentials): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // 使用后端验证Schema
    loginSchema.parse(values);
  } catch (error: any) {
    // Zod验证错误
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path[0];
        errors[field] = err.message;
      });
    }
  }

  return errors;
};

/**
 * 注册表单验证
 * 
 * 使用与后端一致的验证规则
 */
export const validateRegisterForm = (values: RegisterData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // 使用后端验证Schema
    registerSchema.parse(values);
  } catch (error: any) {
    // Zod验证错误
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path[0];
        errors[field] = err.message;
      });
    }
  }

  return errors;
};

/**
 * 验证密码是否符合规则
 * 
 * 此方法保留以提供更详细的密码强度反馈
 */
export const validatePasswordStrength = (password: string): string[] => {
  const errors: string[] = [];

  // 验证密码长度
  if (password.length < AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) {
    errors.push(`密码至少需要${AUTH_CONSTANTS.PASSWORD.MIN_LENGTH}个字符`);
  }

  // 验证是否包含数字
  if (AUTH_CONSTANTS.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  // 验证是否包含小写字母
  if (AUTH_CONSTANTS.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  // 验证是否包含大写字母
  if (AUTH_CONSTANTS.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  // 验证是否包含特殊字符
  if (AUTH_CONSTANTS.PASSWORD.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return errors;
}; 