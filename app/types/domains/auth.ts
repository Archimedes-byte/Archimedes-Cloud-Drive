/**
 * 认证系统统一类型定义
 * 
 * 所有认证相关类型的集中定义，避免重复和不一致
 */

// NextAuth会话类型扩展
import { DefaultSession } from 'next-auth';
import { AUTH_ERROR_CODE } from '@/app/constants/auth';
import { 
  UserBasic,
  AuthJWT
} from '@/app/types/shared/api-types';

/**
 * 完整用户信息(包含敏感字段)
 */
export interface UserFull extends UserBasic {
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 认证错误
 */
export interface AuthError {
  message: string;
  code: AUTH_ERROR_CODE;
  status?: number;
  originalError?: Error;
}

/**
 * 邮箱校验结果
 */
export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 凭据校验结果
 */
export interface CredentialsValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 密码要求
 */
export interface PasswordRequirements {
  minLength: number;
  requireNumbers: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireSpecialChars: boolean;
}

/**
 * 会话用户信息
 */
export interface SessionUser extends UserBasic {
  role?: string;
  permissions?: string[];
}

/**
 * 认证会话扩展
 */
export interface AuthSession {
  user: SessionUser;
  expires: string;
  accessToken?: string;
  refreshToken?: string;
}

// 扩展NextAuth会话类型定义
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
  
  interface User extends UserBasic {}
}

// 扩展NextAuth JWT类型定义
declare module 'next-auth/jwt' {
  interface JWT extends AuthJWT {}
} 