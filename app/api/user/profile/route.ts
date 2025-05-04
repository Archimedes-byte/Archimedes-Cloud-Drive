import { NextRequest } from 'next/server'
import { UserProfileInput } from '@/app/types/user'
import { handleApiError } from '@/app/utils/api/error-handler'
import { createSuccessResponse } from '@/app/utils/api/response-builder'
import { SessionManager } from '@/app/services/session/SessionManager'
import { profileService } from '@/app/services/user/profile'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth'

// 创建会话管理器实例
const sessionManager = new SessionManager(authOptions)

/**
 * 获取用户信息的处理函数
 */
async function getUserProfile(session: any) {
  try {
    const userProfile = await profileService.getUserWithProfile(session.user.email)
    return createSuccessResponse({ profile: userProfile })
  } catch (error) {
    return handleApiError(error, '获取用户资料失败')
  }
}

/**
 * 更新用户资料的处理函数
 */
async function updateUserProfile(session: any, request: NextRequest) {
  try {
    const data = await request.json() as UserProfileInput
    const updatedProfile = await profileService.updateUserProfile(session.user.email, data)
    return createSuccessResponse({ profile: updatedProfile })
  } catch (error) {
    return handleApiError(error, '更新用户信息失败')
  }
}

// 导出路由处理函数
export const GET = sessionManager.createHandler(getUserProfile)
export const PUT = sessionManager.createHandler(
  async (session, request) => updateUserProfile(session, request as NextRequest),
  true
) 