import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
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