import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { fileIds } = await request.json();
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: '请选择要删除的文件' },
        { status: 400 }
      );
    }

    // 验证文件所有权
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: session.user.id,
        isDeleted: false
      }
    });

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: '部分文件不存在或无权限删除' },
        { status: 403 }
      );
    }

    // 软删除文件
    const result = await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        uploaderId: session.user.id
      },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json(
      { error: '删除文件失败' },
      { status: 500 }
    );
  }
} 