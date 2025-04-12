/**
 * 认证相关类型定义
 * 
 * 包含用户认证、权限和会话相关的类型定义
 */

// 用户基本信息接口
export interface UserBasic {
  id: string;
  name: string | null;
  email: string;
}

// 用户认证状态接口
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserBasic | null;
  error: string | null;
}

// 登录凭据接口
export interface LoginCredentials {
  email: string;
  password: string;
}

// 注册数据接口
export interface RegisterData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// 认证提供商类型
export type AuthProvider = 'credentials' | 'google' | 'github';

// 认证令牌接口
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

// OAuth账户类型
export interface OAuthAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  refreshToken?: string | null;
  accessToken?: string | null;
  expiresAt?: number | null;
} 