/**
 * Auth 功能导入重定向
 * 
 * 这个文件通过从 @/app/lib/auth/auth 重新导出 authOptions
 * 以保持与已有代码的导入兼容
 */

export { authOptions } from '@/app/lib/auth/auth';
export * from '@/app/lib/auth/index'; 