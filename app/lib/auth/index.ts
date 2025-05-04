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
  toUserBasic,
  getUserBasicById
} from './user-service';

// 导出认证选项
export { authOptions } from './auth';

// 注意: 不再导出prisma - 请从 @/app/lib/database 导入

// 废弃的常量和工具函数移除 
// 现在请使用:
// - 常量: @/app/constants/auth
// - 错误处理: @/app/utils/error
// - 验证工具: @/app/utils/validation

// 导出类型定义
export * from '@/app/types/auth'; 