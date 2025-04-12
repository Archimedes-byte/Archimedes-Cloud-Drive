/**
 * 存储相关类型定义
 * 
 * 包含存储配额、使用情况等相关的类型定义
 */

// 存储使用情况接口
export interface StorageUsageInfo {
  used: number;
  total: number;
  percentage?: number;
}

// 存储使用情况组件属性
export interface StorageUsageProps {
  used: number;
  total: number;
}

// 存储类型统计
export interface StorageTypeStats {
  type: string;
  size: number;
  count: number;
  percentage: number;
}

// 存储限制更新请求
export interface StorageLimitUpdateRequest {
  userId: string;
  newLimit: number;
}

// 存储配额调整结果
export interface StorageQuotaResult {
  success: boolean;
  userId: string;
  oldLimit: number;
  newLimit: number;
  message?: string;
} 