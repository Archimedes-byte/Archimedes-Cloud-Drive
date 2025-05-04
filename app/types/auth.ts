/**
 * 认证系统统一类型定义
 * 
 * 所有认证相关类型的集中定义，避免重复和不一致
 */

// NextAuth会话类型扩展
import { DefaultSession } from 'next-auth';
import { AUTH_ERROR_CODE } from '@/app/constants/auth';

// 用户基本信息
export interface UserBasic {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

// 完整用户信息(包含敏感字段)
export interface UserFull extends UserBasic {
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
  profile?: {
    avatarUrl?: string | null;
  };
}

// 登录凭据
export interface LoginCredentials {
  email: string;
  password: string;
}

// 注册数据
export interface RegisterData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// 认证错误
export interface AuthError {
  message: string;
  code: AUTH_ERROR_CODE;
  status?: number;
  originalError?: Error;
}

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// 认证响应
export interface AuthResponse extends ApiResponse {
  data?: {
    user: UserBasic;
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
}

// 密码校验结果
export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

// 邮箱校验结果
export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
}

// 凭据校验结果
export interface CredentialsValidationResult {
  isValid: boolean;
  message?: string;
}

// 密码要求
export interface PasswordRequirements {
  minLength: number;
  requireNumbers: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireSpecialChars: boolean;
}

// NextAuth JWT扩展
export interface AuthJWT {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  accessToken?: string;
  iat?: number;
  exp?: number;
  jti?: string;
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