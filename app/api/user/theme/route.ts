import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { handleApiError } from '@/app/utils/api/error-handler';
import { createSuccessResponse } from '@/app/utils/api/response-builder';
import { SessionManager } from '@/app/services/session/SessionManager';

// 创建会话管理器实例
const sessionManager = new SessionManager(authOptions);

/**
 * GET 获取用户主题设置
 */
export async function GET(req: NextRequest) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: '未授权访问' 
      }, { status: 401 });
    }

    // 查询用户资料中的主题设置
    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId: session.user.id
      },
      select: {
        theme: true
      }
    });

    // 如果找到主题设置，返回给客户端
    if (userProfile?.theme) {
      return NextResponse.json({
        success: true,
        theme: userProfile.theme
      });
    }

    // 如果没有找到，返回空结果
    return NextResponse.json({
      success: true,
      theme: null
    });
  } catch (error) {
    console.error('获取用户主题失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取用户主题失败'
    }, { status: 500 });
  }
}

/**
 * POST 保存用户主题设置
 */
export async function POST(req: NextRequest) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: '未授权访问' 
      }, { status: 401 });
    }

    // 解析请求体
    const { themeId } = await req.json();
    if (!themeId) {
      return NextResponse.json({
        success: false,
        error: '主题ID不能为空'
      }, { status: 400 });
    }

    // 保存或更新用户主题设置到UserProfile表
    const userProfile = await prisma.userProfile.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        theme: themeId,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        theme: themeId
      }
    });
    
    // 同时在session中保存用户当前主题
    // @ts-ignore - 扩展session类型
    if (session.user) {
      // @ts-ignore
      session.user.theme = themeId;
    }

    return NextResponse.json({
      success: true,
      theme: userProfile.theme
    });
  } catch (error) {
    console.error('保存用户主题失败:', error);
    return NextResponse.json({
      success: false,
      error: '保存用户主题失败'
    }, { status: 500 });
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
export const DELETE = sessionManager.createHandler(
  async (session, request) => deleteUserTheme(session, request as NextRequest),
  true
); 
