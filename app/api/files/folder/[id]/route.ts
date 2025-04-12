import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';

export async function GET(
  _request: Request,
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

    // 获取文件夹信息
    const folder = await prisma.file.findFirst({
      where: {
        id: params.id,
        uploaderId: user.id,
        isFolder: true,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: '文件夹不存在' },
        { status: 404 }
      );
    }

    // 获取文件夹内的文件和子文件夹
    const files = await prisma.file.findMany({
      where: {
        parentId: folder.id,
        uploaderId: user.id,
        isDeleted: false,
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        createdAt: true,
        isFolder: true,
        path: true,
        parentId: true,
        tags: true,
      },
    });

    return NextResponse.json({
      folder,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: file.createdAt.toISOString(),
        isFolder: file.isFolder,
        parentId: file.parentId,
        path: file.path,
        tags: file.tags,
      })),
    });
  } catch (error) {
    console.error('获取文件夹内容错误:', error);
    return NextResponse.json(
      { error: '获取文件夹内容失败，请稍后重试' },
      { status: 500 }
    );
  }
} 