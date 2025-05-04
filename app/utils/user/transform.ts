/**
 * 用户数据转换工具函数
 * 
 * 提供统一的用户数据转换函数，避免重复代码
 */
import { UserBasic, UserProfile } from '@/app/types/user';

/**
 * 将原始用户数据转换为基本用户信息
 * 
 * @param user 原始用户数据
 * @returns 基本用户信息
 */
export function toUserBasic(user: any): UserBasic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.profile?.avatarUrl || null
  };
}

/**
 * 从用户和资料数据构建完整的用户资料对象
 * 
 * @param user 用户数据
 * @param profile 用户资料数据
 * @returns 格式化的用户资料对象
 */
export function toUserProfile(user: any, profile: any): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: profile?.avatarUrl || null,
    theme: profile?.theme || null,
    role: user.role || null,
    accountType: user.accountType || 'free',
    bio: profile?.bio || null,
    location: profile?.location || null,
    website: profile?.website || null,
    company: profile?.company || null,
    storageUsed: user.storageUsed || 0,
    storageLimit: user.storageLimit || 0,
    createdAt: user.createdAt ? user.createdAt.toISOString() : '',
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : ''
  };
} 