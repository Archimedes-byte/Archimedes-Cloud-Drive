/**
 * 文件类型定义索引
 * 
 * 导出所有文件相关类型定义
 */

export * from './file';
export * from './folder';
export * from './upload';
export * from './storage';

// 修复导出歧义，明确使用folder.ts中的FileTreeNode
export type { FileTreeNode } from './folder'; 