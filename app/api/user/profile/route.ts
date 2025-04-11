import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  STATUS_CODES, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  apiHandler
} from '@/app/lib/api/responseHandler';

// 从前端获取的用户资料接口
interface UserProfileInput {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  avatarUrl?: string
  theme?: string
}

// 用户资料接口
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatarUrl?: string; // 改为可选字符串而不是null
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  theme: string;
  createdAt: string;
  storageUsed: number;
  storageLimit: number;
  storagePercentUsed: number;
  totalFiles: number;
  recentFiles?: {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: string;
  }[];
}

// 返回给前端的用户资料接口
interface UserProfileResponse {
  id: string
  email: string
  name: string | null
  avatarUrl?: string | null
  theme?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  company?: string | null
  storageUsed: number
  storageLimit: number
  createdAt: string
  updatedAt: string
}

// 更新用户资料验证模式
const UpdateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('请输入有效的网址').max(255).optional().nullable(),
  company: z.string().max(100).optional(),
  avatarUrl: z.string().url('请输入有效的图片地址').max(500).optional().nullable(),
  theme: z.string().max(50).optional()
});

export const dynamic = 'force-dynamic';

/**
 * 获取用户资料
 */
export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    try {
      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          profile: true
        }
      });

      if (!user) {
        return createErrorResponse(
          '用户不存在',
          STATUS_CODES.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }

      // 获取存储使用情况
      const storageInfo = {
        storageUsed: user.storageUsed || 0,
        storageLimit: user.storageLimit || 0,
        storagePercent: user.storageLimit ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0
      };
      
      // 响应对象包含用户基本信息和资料
      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        profile: user.profile || null,
        storage: storageInfo
      };
      
      return createSuccessResponse(
        userInfo,
        '用户资料获取成功'
      );
    } catch (error) {
      console.error('获取用户资料错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
}

/**
 * 更新用户资料
 */
export async function PATCH(req: NextRequest) {
  return apiHandler(async () => {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    try {
      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        return createErrorResponse(
          '用户不存在',
          STATUS_CODES.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }

      // 解析并验证请求数据
      const data = await req.json();
      const validationResult = UpdateProfileSchema.safeParse(data);
      
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const profileData = validationResult.data;
      
      // 检查用户是否已有资料
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id }
      });
      
      let updatedProfile;
      
      if (existingProfile) {
        // 更新现有资料
        updatedProfile = await prisma.userProfile.update({
          where: { userId: user.id },
          data: profileData
        });
      } else {
        // 创建新资料
        updatedProfile = await prisma.userProfile.create({
          data: {
            ...profileData,
            userId: user.id
          }
        });
      }
      
      return createSuccessResponse(
        updatedProfile,
        '用户资料更新成功'
      );
    } catch (error) {
      console.error('更新用户资料错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
} 