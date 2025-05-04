/**
 * 用户资料服务
 * 
 * 集中处理所有用户资料相关的业务逻辑
 */
import { prisma } from '@/app/lib/database';
import { UserProfile, UserProfileInput } from '@/app/types/user';
import { toUserProfile } from '@/app/utils/user/transform';

/**
 * 用户资料服务
 */
export const profileService = {
  /**
   * 获取用户及其资料
   */
  async getUserWithProfile(email: string): Promise<UserProfile> {
    // 查询用户，并包含用户资料
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户资料是否存在，不存在则创建默认资料
    if (!user.profile) {
      return this.createDefaultProfile(user);
    }

    return toUserProfile(user, user.profile);
  },

  /**
   * 创建默认用户资料
   */
  async createDefaultProfile(user: any): Promise<UserProfile> {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建默认资料
      const newProfile = await tx.userProfile.create({
        data: {
          userId: user.id,
          theme: 'default',
          bio: '',
          location: '',
          website: '',
          company: ''
        }
      });
      
      // 重新获取包含资料的用户
      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        include: { profile: true }
      });
      
      if (!updatedUser || !updatedUser.profile) {
        throw new Error('创建资料后无法检索用户数据');
      }
      
      return { user: updatedUser, profile: updatedUser.profile };
    });
    
    return toUserProfile(result.user, result.profile);
  },

  /**
   * 更新用户资料
   */
  async updateUserProfile(email: string, data: UserProfileInput): Promise<UserProfile> {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 获取用户
      const user = await tx.user.findUnique({
        where: { email },
        include: { profile: true }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 更新用户名称(如果提供了name字段)
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          name: data.name !== undefined ? data.name : user.name
        }
      });

      // 更新或创建用户资料
      const profile = await tx.userProfile.upsert({
        where: { userId: user.id },
        update: {
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.profile?.avatarUrl,
          theme: data.theme !== undefined ? data.theme : user.profile?.theme,
          bio: data.bio !== undefined ? data.bio : user.profile?.bio,
          location: data.location !== undefined ? data.location : user.profile?.location,
          website: data.website !== undefined ? data.website : user.profile?.website,
          company: data.company !== undefined ? data.company : user.profile?.company
        },
        create: {
          userId: user.id,
          avatarUrl: data.avatarUrl,
          theme: data.theme || 'default',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          company: data.company || ''
        }
      });

      return { user: updatedUser, profile };
    });

    return toUserProfile(result.user, result.profile);
  }
}; 