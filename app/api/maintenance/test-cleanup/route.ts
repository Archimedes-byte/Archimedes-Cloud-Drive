import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    // 模拟清理请求
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/cleanup`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    const result = await response.json();

    return NextResponse.json({
      message: '测试清理完成',
      result
    });
  } catch (error) {
    console.error('测试清理出错:', error);
    return NextResponse.json(
      { error: '测试失败，请检查日志' },
      { status: 500 }
    );
  }
} 