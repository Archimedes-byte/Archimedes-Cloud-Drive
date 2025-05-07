import { NextRequest } from 'next/server';
import { handleApiError } from '@/app/utils/api/error-handler';
import { createSuccessResponse } from '@/app/utils/api/response-builder';
import { SessionManager } from '@/app/services/session/SessionManager';
import { prisma } from '@/app/lib/database';
import { authOptions } from '@/app/lib/auth';

// 创建会话管理器实例
const sessionManager = new SessionManager(authOptions);

// 自定义主题类型
interface ThemeConfig {
  id: string;
  customThemes?: Record<string, any>;
}

/**
 * 获取用户主题
 * 从数据库读取用户主题设置
 */
async function getUserTheme(session: any) {
  try {
    const userId = session.user.id;
    
    // 从数据库查询用户主题设置
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });
    
    let themeConfig: ThemeConfig = {
      id: userProfile?.theme || 'default',
      customThemes: {}
    };
    
    // 如果用户资料存在额外主题数据
    if (userProfile?.theme) {
      // 尝试从localStorage加载用户自定义主题，在前端处理
      return createSuccessResponse({ 
        theme: themeConfig.id,
        userProfileExists: !!userProfile
      });
    } else {
      // 用户未设置主题，使用默认主题
      return createSuccessResponse({ 
        theme: 'default',
        userProfileExists: !!userProfile
      });
    }
  } catch (error) {
    return handleApiError(error, '获取用户主题失败');
  }
}

/**
 * 保存用户主题
 * 将主题ID保存到用户配置
 */
async function saveUserTheme(session: any, request: NextRequest) {
  try {
    const { themeId } = await request.json();
    const userId = session.user.id;
    
    console.log(`保存主题到用户配置：userId=${userId}, themeId=${themeId}`);
    
    // 更新用户资料中的主题设置
    await prisma.userProfile.upsert({
      where: { userId },
      update: { theme: themeId },
      create: {
        userId,
        theme: themeId
      }
    });
    
    console.log(`主题 ${themeId} 已成功保存到数据库`);
    
    return createSuccessResponse({ 
      success: true,
      message: '主题已保存',
      themeId: themeId  // 返回保存的主题ID，确保前端知道实际保存的是什么
    });
  } catch (error) {
    console.error('保存用户主题失败:', error);
    return handleApiError(error, '保存用户主题失败');
  }
}

/**
 * 删除用户自定义主题
 */
async function deleteUserTheme(session: any, request: NextRequest) {
  try {
    const { themeId } = await request.json();
    const userId = session.user.id;
    
    // 删除指定的自定义主题
    await prisma.customTheme.delete({
      where: {
        id_userId: {
          id: themeId,
          userId
        }
      }
    });
    
    // 如果用户当前使用的正是被删除的主题，则重置为默认主题
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });
    
    if (userProfile?.theme === themeId) {
      await prisma.userProfile.update({
        where: { userId },
        data: { theme: 'default' }
      });
    }
    
    return createSuccessResponse({ 
      success: true,
      message: '主题已删除'
    });
  } catch (error) {
    return handleApiError(error, '删除用户主题失败');
  }
}

// 导出路由处理函数
export const GET = sessionManager.createHandler(getUserTheme);
export const POST = sessionManager.createHandler(
  async (session, request) => saveUserTheme(session, request as NextRequest),
  true
);
export const DELETE = sessionManager.createHandler(
  async (session, request) => deleteUserTheme(session, request as NextRequest),
  true
); 
