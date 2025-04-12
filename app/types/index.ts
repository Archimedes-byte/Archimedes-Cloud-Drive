/**
 * 类型定义统一导出
 * 
 * 本文件导出所有应用中使用的类型定义，集中在一个地方管理
 * 类型按照功能领域和用途进行分类，便于维护和查找
 */

// 导出核心/通用类型
export * from './core/common';
export * from './core/auth';
export * from './core/api';

// 导出文件相关类型
export * from './files';

// 导出UI相关类型
export * from './ui';

// 导出API相关类型
export * from './api';

// 导出业务领域类型
export * from './domains';

// 导出第三方服务集成类型
// 如果integrations子目录未被TSC正确识别，可能需要项目重新构建
// export * from './integrations/google-user';

// 导出全局类型扩展
// 注意：.d.ts文件通常不需要显式导出，它们在全局范围内自动生效
// export * from './global/next-auth';
// export * from './global/declarations';

// 解决导出歧义
export type { PaginatedResponse } from './core/common'; 