/**
 * 认证模块 (Authentication Module)
 * 
 * 此模块负责用户认证、授权和会话管理，提供统一的身份验证接口。
 * 主要功能：
 * - 用户登录与注册
 * - 会话管理与令牌验证
 * - 第三方认证集成（Google等）
 * - 权限控制
 * 
 * @example
 * // 使用认证选项
 * import { authOptions } from '@/app/lib/auth';
 * 
 * // 验证Google令牌
 * import { verifyGoogleToken } from '@/app/lib/auth';
 * const user = await verifyGoogleToken(token);
 */

// 导出核心认证配置
export { authOptions } from './auth';

// 导出Google认证功能
export { verifyGoogleToken } from './google-auth';

// 导出认证错误处理
export {
  isNetworkError,
  getFormattedAuthError,
  retryWithDelay
} from './auth-error-handler'; 