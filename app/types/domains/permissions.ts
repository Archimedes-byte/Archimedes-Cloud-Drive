/**
 * 权限相关类型定义
 * 
 * 包含用户权限和访问控制相关的类型定义
 */

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