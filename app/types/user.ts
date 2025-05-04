/**
 * 用户信息相关类型定义
 * 
 * 包含用户个人信息和资料相关的所有类型定义
 */

/**
 * 用户基本信息接口
 * 用于基础显示和身份验证
 */
export interface UserBasic {
  /** 用户ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 用户名 */
  name: string | null;
  /** 头像URL */
  avatarUrl?: string | null;
}

/**
 * 用户资料接口
 * 包含完整用户信息
 */
export interface UserProfile extends UserBasic {
  /** 主题 */
  theme?: string | null;
  /** 账户类型 */
  accountType?: 'free' | 'premium' | 'enterprise';
  /** 用户角色 */
  role?: string | null;
  /** 已使用存储空间（字节） */
  storageUsed: number;
  /** 存储空间限制（字节） */
  storageLimit: number;
  /** 用户简介 */
  bio?: string | null;
  /** 位置 */
  location?: string | null;
  /** 网站 */
  website?: string | null;
  /** 公司 */
  company?: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 用户资料更新输入
 */
export interface UserProfileInput {
  /** 显示名称 */
  name?: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 主题 */
  theme?: string;
  /** 用户简介 */
  bio?: string;
  /** 位置 */
  location?: string;
  /** 网站 */
  website?: string;
  /** 公司 */
  company?: string;
} 