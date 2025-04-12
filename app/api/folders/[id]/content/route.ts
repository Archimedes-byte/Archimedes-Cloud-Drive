import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

/**
 * 获取文件夹内容
 * 
 * 此API端点返回特定文件夹的内容
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 检查文件夹是否存在且属于当前用户
    const folder = await prisma.file.findFirst({
      where: {
        id: params.id,
        uploaderId: user.id,
        isFolder: true,
        isDeleted: false,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 获取文件夹内的所有文件和子文件夹
    const contents = await prisma.file.findMany({
      where: {
        parentId: params.id,
        isDeleted: false,
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      folder,
      contents,
    });
  } catch (error) {
    console.error('获取文件夹内容失败:', error);
    return NextResponse.json(
      { error: '获取文件夹内容失败' },
      { status: 500 }
    );
  }
} 