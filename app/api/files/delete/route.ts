import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    const { fileIds } = await request.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: '无效的文件ID' },
        { status: 400 }
      );
    }

    // 获取要删除的文件信息
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: user.id,
        isDeleted: false
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: '未找到要删除的文件' },
        { status: 404 }
      );
    }

    // 删除物理文件
    for (const file of files) {
      if (!file.isFolder) {
        const filePath = join(process.cwd(), file.path);
        if (existsSync(filePath)) {
          try {
            await unlink(filePath);
            console.log('物理文件已删除:', filePath);
          } catch (error) {
            console.error('删除物理文件失败:', filePath, error);
          }
        }
      }
    }

    // 更新数据库记录
    await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        uploaderId: user.id
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    // 更新用户存储空间使用量
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        storageUsed: {
          decrement: totalSize
        }
      }
    });

    return NextResponse.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('删除文件错误:', error);
    return NextResponse.json(
      { error: '删除文件失败，请稍后重试' },
      { status: 500 }
    );
  }
} 