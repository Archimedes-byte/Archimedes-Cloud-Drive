import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { ExtendedFile } from '../../../types/index';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type');

    if (!query) {
      return NextResponse.json(
        { error: '请输入搜索关键词' },
        { status: 400 }
      );
    }

    const where: Prisma.FileWhereInput = {
      uploaderId: session.user.id,
      isDeleted: false,
      ...(type ? { type } : {}),
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive
          }
        },
        {
          tags: {
            hasSome: [query]
          }
        }
      ]
    };

    const files = await prisma.file.findMany({
      where,
      orderBy: [
        { isFolder: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const extendedFiles: ExtendedFile[] = files.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size || 0,
      type: file.type as any,
      isFolder: file.isFolder,
      isDeleted: file.isDeleted || false,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      uploaderId: file.uploaderId,
      path: file.path,
      tags: file.tags as string[],
      parentId: file.parentId,
      extension: file.name.split('.').pop(),
      fullPath: file.path
    }));

    return NextResponse.json({
      success: true,
      data: extendedFiles
    });
  } catch (error) {
    console.error('搜索文件失败:', error);
    return NextResponse.json(
      { error: '搜索文件失败' },
      { status: 500 }
    );
  }
} 