/**
 * 用户服务
 * 
 * 提供统一的用户管理功能，包括用户查询、创建、更新等
 */
import { prisma } from '@/app/lib/database';
import { UserBasic } from '@/app/types';
import { AUTH_ERROR_CODE } from '@/app/constants/auth';
import { createAuthError } from '@/app/lib/error/auth-error';
import { toUserBasic } from '@/app/utils/user/transform';

// 通过邮箱查找用户
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      profile: {
        select: {
          avatarUrl: true
        }
      }
    }
  });
}

// 通过ID查找用户
export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      profile: {
        select: {
          avatarUrl: true
        }
      }
    }
  });
}

// 创建新用户
export async function createUser(userData: { 
  email: string;
  name?: string;
  password: string;
  avatarUrl?: string;
}) {
  const { email, name, password, avatarUrl } = userData;
  
  return await prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0], // 如果没提供名称，使用邮箱前缀
      password,
      ...(avatarUrl ? {
        profile: {
          create: {
            avatarUrl
          }
        }
      } : {})
    },
    include: {
      profile: true
    }
  });
}

// 更新用户头像
export async function updateUserAvatar(userId: string, avatarUrl: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw createAuthError('用户不存在', AUTH_ERROR_CODE.ACCOUNT_NOT_FOUND);
  }
  
  return await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        upsert: {
          create: {
            avatarUrl
          },
          update: {
            avatarUrl
          }
        }
      }
    },
    include: {
      profile: true
    }
  });
}

// 根据ID获取基本用户信息
export async function getUserBasicById(id: string): Promise<UserBasic> {
  const user = await findUserById(id);
  if (!user) {
    throw createAuthError('用户不存在', AUTH_ERROR_CODE.ACCOUNT_NOT_FOUND);
  }
  
  return toUserBasic(user);
} 