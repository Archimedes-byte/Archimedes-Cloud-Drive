/**
 * 类型定义统一导出
 * 
 * 本文件导出所有应用中使用的类型定义，集中在一个地方管理
 */

// 导出通用类型
export * from './common';

// 导出文件相关类型
export * from './file';

// 导出文件管理相关类型
export * from './fileManagement';

// 导出UI相关类型
export * from './ui';

// 导出API相关类型
export * from './api';

// 以下是未分类的类型定义，后续可能会移动到专门的类型文件中

// 搜索类型定义
export interface SearchOptions {
  query: string;
  type?: string | null;
  tags?: string[];
  limit?: number;
}

// 权限类型定义
export interface Permission {
  id: string;
  fileId: string;
  userId: string;
  email?: string;
  name?: string;
  accessLevel: 'read' | 'write' | 'admin';
  createdAt: string | Date;
} 