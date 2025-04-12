/**
 * 用户资料相关类型定义
 * 
 * 包含用户个人信息和资料相关的类型定义
 */

// 用户资料类型
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  storageUsed?: number;
  storageLimit?: number;
  createdAt?: string;
  updatedAt?: string;
} 