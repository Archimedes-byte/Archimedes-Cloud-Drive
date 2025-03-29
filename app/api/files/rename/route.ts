import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { rename } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
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

    const { fileId, newName } = await request.json();

    // 获取文件信息
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 构建新的文件路径
    const oldPath = join(process.cwd(), file.path);
    const newPath = join(process.cwd(), file.path.replace(file.name, newName));

    // 重命名文件
    await rename(oldPath, newPath);

    // 更新数据库记录
    await prisma.file.update({
      where: { id: fileId },
      data: {
        name: newName,
        path: file.path.replace(file.name, newName),
      },
    });

    return NextResponse.json({ message: '重命名成功' });
  } catch (error) {
    console.error('重命名错误:', error);
    return NextResponse.json(
      { error: '重命名失败，请稍后重试' },
      { status: 500 }
    );
  }
} 