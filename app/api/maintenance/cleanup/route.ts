import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    // 获取所有已标记为删除的文件
    const deletedFiles = await prisma.file.findMany({
      where: {
        isDeleted: true,
        isFolder: false
      }
    });

    // 删除物理文件
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of deletedFiles) {
      const filePath = join(process.cwd(), file.path);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
          deletedCount++;
          console.log('物理文件已删除:', filePath);
        } catch (error) {
          errorCount++;
          console.error('删除物理文件失败:', filePath, error);
        }
      }
    }

    // 清理空文件夹
    const emptyFolders = await prisma.file.findMany({
      where: {
        isDeleted: true,
        isFolder: true
      }
    });

    for (const folder of emptyFolders) {
      const folderPath = join(process.cwd(), folder.path);
      if (existsSync(folderPath)) {
        try {
          // 检查文件夹是否为空
          const files = await prisma.file.findMany({
            where: {
              parentId: folder.id,
              isDeleted: false
            }
          });

          if (files.length === 0) {
            await unlink(folderPath);
            console.log('空文件夹已删除:', folderPath);
          }
        } catch (error) {
          console.error('删除空文件夹失败:', folderPath, error);
        }
      }
    }

    return NextResponse.json({
      message: '清理完成',
      stats: {
        deletedFiles: deletedCount,
        errorCount: errorCount
      }
    });
  } catch (error) {
    console.error('清理过程出错:', error);
    return NextResponse.json(
      { error: '清理失败，请稍后重试' },
      { status: 500 }
    );
  }
} 