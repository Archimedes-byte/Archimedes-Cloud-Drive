import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 验证用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'name';

    // 构建查询条件
    const where = {
      userId: user.id,
      isDeleted: false,
      ...(type === 'name' ? {
        name: {
          contains: query,
        }
      } : {
        tag: {
          contains: query,
        }
      })
    };

    // 获取文件列表
    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        createdAt: true,
        tag: true,
        source: true,
        isFolder: true,
      },
    });

    // 格式化返回数据
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: file.createdAt,
      tag: file.tag,
      source: file.source,
      isFolder: file.isFolder,
    }));

    return NextResponse.json({
      files: formattedFiles,
    });
  } catch (error) {
    console.error('搜索文件失败:', error);
    return NextResponse.json(
      { error: '搜索文件失败' },
      { status: 500 }
    );
  }
} 