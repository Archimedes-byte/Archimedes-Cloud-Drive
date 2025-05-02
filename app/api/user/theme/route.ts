import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/database';
import { authOptions } from '@/app/lib/auth';

// 获取用户当前主题
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      theme: user.profile?.theme || 'default'
    });
  } catch (error) {
    console.error('获取主题失败:', error);
    return NextResponse.json(
      { success: false, error: '获取主题失败' },
      { status: 500 }
    );
  }
}

// 更新用户主题
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取请求体
    const data = await request.json();
    const { theme } = data;
    
    if (!theme) {
      return NextResponse.json(
        { success: false, error: '未提供主题参数' },
        { status: 400 }
      );
    }

    // 验证主题是否有效
    const validThemes = [
      // 基础色彩主题
      'default', 'violet', 'emerald', 'amber', 'rose',
      // 渐变主题
      'ocean', 'sunset', 'forest', 'galaxy', 
      // 季节主题
      'spring', 'summer', 'autumn', 'winter',
      // 柔和主题 - 浅色系列
      'pastel_pink', 'pastel_blue', 'pastel_lavender', 'pastel_mint', 
      'pastel_peach', 'pastel_lemon', 'pastel_teal'
    ];
    if (!validThemes.includes(theme)) {
      return NextResponse.json(
        { success: false, error: '无效的主题' },
        { status: 400 }
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 更新用户主题
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { theme },
      create: {
        userId: user.id,
        name: session.user.name || '',
        theme
      }
    });

    return NextResponse.json({
      success: true,
      theme
    });
  } catch (error) {
    console.error('更新主题失败:', error);
    return NextResponse.json(
      { success: false, error: '更新主题失败' },
      { status: 500 }
    );
  }
} 
