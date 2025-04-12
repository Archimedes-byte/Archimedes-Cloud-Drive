/**
 * 搜索相关类型定义
 * 
 * 包含搜索功能相关的类型定义
 */

// 搜索类型定义
export interface SearchOptions {
  query: string;
  type?: string | null;
  tags?: string[];
  limit?: number;
} 