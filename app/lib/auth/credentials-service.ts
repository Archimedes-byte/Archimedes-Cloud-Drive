/**
 * 邮箱密码认证服务
 * 
 * 提供NextAuth兼容的凭据认证服务
 */
import { UserBasic } from '@/app/types/auth';
import { verifyCredentials, getUserBasicById } from './auth-service';

// 重新导出验证凭证函数供NextAuth使用
export { verifyCredentials, getUserBasicById }; 