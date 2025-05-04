/**
 * 用户资料转换工具函数
 * 
 * 提供处理用户资料数据结构转换的标准化函数
 */
import { UserProfile, UserProfileInput } from '@/app/types/user';

/**
 * 将UserProfile对象转换为UserProfileInput对象
 * 处理字段映射和null值转换为undefined
 * 
 * @param profile 用户资料对象
 * @returns 符合API要求的用户资料输入对象
 */
export function profileToProfileInput(profile: UserProfile): UserProfileInput {
  if (!profile) {
    throw new Error('用户资料不能为空');
  }
  
  return {
    // 基础信息
    name: profile.name || '',
    
    // 个人信息
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    company: profile.company || '',
    
    // 媒体和偏好
    avatarUrl: profile.avatarUrl === null ? undefined : profile.avatarUrl,
    theme: profile.theme === null ? undefined : profile.theme
  };
}

/**
 * 创建部分用户资料更新对象
 * 可以只更新用户资料的部分字段
 * 
 * @param profile 原始资料对象
 * @param updates 需要更新的字段，可以是部分字段
 * @returns 符合API要求的用户资料输入对象
 */
export function createProfileUpdate(
  profile: UserProfile, 
  updates: Partial<UserProfile>
): UserProfileInput {
  // 合并原始资料和更新
  const updatedProfile = {
    ...profile,
    ...updates
  };
  
  // 转换为API所需格式
  return profileToProfileInput(updatedProfile);
}

/**
 * 验证规则接口
 */
export interface ProfileValidationRule {
  required: boolean;
  maxLength: number;
  isUrl?: boolean;
}

/**
 * 验证规则配置
 * 每个字段的验证配置
 */
export const profileValidationRules: Record<string, ProfileValidationRule> = {
  name: { required: true, maxLength: 50 },
  bio: { required: false, maxLength: 500 },
  location: { required: false, maxLength: 100 },
  website: { required: false, maxLength: 100, isUrl: true },
  company: { required: false, maxLength: 100 }
}; 