import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    // 获取维护日志
    const logs = await prisma.maintenanceLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // 限制返回最近100条记录
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('获取维护日志失败:', error);
    return NextResponse.json(
      { error: '获取维护日志失败' },
      { status: 500 }
    );
  }
} 