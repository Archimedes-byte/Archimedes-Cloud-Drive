/**
 * Prisma客户端实例 (Prisma Client Instance)
 * 
 * 此模块负责创建和管理Prisma ORM客户端实例，确保在整个应用中使用单一的数据库连接。
 * 实现了以下功能：
 * - 在开发环境中使用全局单例模式，防止热重载时创建多个连接
 * - 在生产环境中为每个请求创建新的Prisma实例
 * - 提供类型安全的数据库访问接口
 */

import { PrismaClient } from '@prisma/client';

// 创建全局类型，用于在开发环境中存储Prisma实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 优化Prisma客户端配置以加快启动速度
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // 优化连接配置
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // 禁用查询引擎日志以提高性能
  errorFormat: 'minimal',
  // 连接池配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 在开发环境中保存实例到全局变量，避免热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 