/**
 * 认证系统导出
 */

// 从新位置导出常量
export { AUTH_CONSTANTS, AUTH_ERROR_CODE, AUTH_ACTION } from '@/app/constants/auth';

// 导出错误处理
export { createAuthError, logAuthError, getFriendlyErrorMessage } from '@/app/lib/error/auth-error';

// 导出凭据服务
export { verifyCredentials } from './credentials-service';

// 导出用户服务
export {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserAvatar,
  getUserBasicById
} from './user-service';

// 导出认证选项
export { authOptions } from './auth';

// 导出类型定义
export type { 
  LoginCredentials,
  RegisterData,
  AuthError,
  UserFull,
  AuthJWT,
  PasswordValidationResult,
  EmailValidationResult,
  CredentialsValidationResult,
  PasswordRequirements
} from '@/app/types'; 