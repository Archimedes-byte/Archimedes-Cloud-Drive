/**
 * 认证钩子导出
 * 
 * 提供统一的认证相关钩子导出
 */

// 表单钩子
export { useAuthForm } from './useAuthForm';

// 认证上下文钩子及类型
export { useAuth, AuthStatus, ErrorSeverity } from '@/app/contexts/auth'; 