/**
 * 共享验证Schema
 * 
 * 提供前后端共用的验证规则，确保一致性
 */
import { z } from 'zod';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

/**
 * 邮箱验证Schema
 */
export const emailSchema = z.string()
  .min(1, '请输入邮箱')
  .email('请输入有效的邮箱地址');

/**
 * 密码验证Schema，根据AUTH_CONSTANTS配置
 */
export const passwordSchema = z.string()
  .min(AUTH_CONSTANTS.PASSWORD.MIN_LENGTH, `密码至少需要${AUTH_CONSTANTS.PASSWORD.MIN_LENGTH}个字符`)
  .refine((value) => {
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_NUMBERS) {
      return /\d/.test(value);
    }
    return true;
  }, { message: '密码必须包含数字' })
  .refine((value) => {
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_UPPERCASE) {
      return /[A-Z]/.test(value);
    }
    return true;
  }, { message: '密码必须包含大写字母' })
  .refine((value) => {
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_LOWERCASE) {
      return /[a-z]/.test(value);
    }
    return true;
  }, { message: '密码必须包含小写字母' })
  .refine((value) => {
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_SPECIAL) {
      return /[^A-Za-z0-9]/.test(value);
    }
    return true;
  }, { message: '密码必须包含特殊字符' });

/**
 * 基础用户名Schema
 */
export const nameSchema = z.string()
  .min(2, '用户名至少2个字符')
  .max(30, '用户名最多30个字符');

/**
 * 登录凭据验证Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码')
});

/**
 * 注册数据验证Schema
 */
export const registerSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, '请确认密码').optional()
}).refine(data => !data.confirmPassword || data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
});

/**
 * 基于验证Schema提取类型
 */
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type RegisterSchemaType = z.infer<typeof registerSchema>;

/**
 * 辅助函数：验证密码强度
 * @param password 密码字符串
 * @returns 密码强度与消息
 */
export function checkPasswordStrength(password: string): { 
  strength: 'weak' | 'medium' | 'strong', 
  message: string 
} {
  // 检查各项条件满足情况
  const hasNumber = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const conditionsMet = [hasNumber, hasLowercase, hasUppercase, hasSpecial].filter(Boolean).length;
  
  // 根据条件数量和长度判断强度
  if (conditionsMet >= 3 && password.length >= AUTH_CONSTANTS.PASSWORD.RECOMMENDED_LENGTH) {
    return { strength: 'strong', message: '密码强度很高' };
  } else if (conditionsMet >= 2 && password.length >= AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) {
    return { strength: 'medium', message: '密码强度适中' };
  } else {
    return { strength: 'weak', message: '密码强度较弱' };
  }
} 