/**
 * Prisma客户端
 * 提供数据库连接和操作功能
 */
import { PrismaClient } from '@prisma/client';

// 防止开发环境下热重载时创建多个实例
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 创建或复用Prisma客户端实例
export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 只在非生产环境下将prisma分配给全局对象
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export default db; 