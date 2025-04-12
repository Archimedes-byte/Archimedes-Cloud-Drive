/**
 * Prisma 客户端导入重定向
 * 
 * 这个文件通过从 @/app/lib/database/prisma 重新导出 prisma 实例
 * 以保持与已有代码的导入兼容
 */

export { prisma } from '@/app/lib/database/prisma';
export { prisma as default } from '@/app/lib/database/prisma'; 