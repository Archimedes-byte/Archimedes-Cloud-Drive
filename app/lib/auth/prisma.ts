/**
 * Prisma 客户端导入重定向
 * 
 * 这个文件通过从 @/app/lib/database/prisma 重新导出 prisma 实例
 * 以保持与 auth.ts 中的相对路径导入兼容
 */

export { prisma } from '@/app/lib/database/prisma'; 