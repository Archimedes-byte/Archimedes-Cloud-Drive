import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { ApiResponse } from '../interfaces';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        message: '未授权访问',
        data: null
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const type = searchParams.get('type');

    const files = await prisma.file.findMany({
      where: {
        uploaderId: session.user.id,
        parentId: folderId || null,
        ...(type && { type })
      },
      orderBy: [
        { isFolder: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // 格式化日期字段为 ISO 字符串
    const formattedFiles = files.map(file => ({
      ...file,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString()
    }));

    return NextResponse.json<ApiResponse<typeof formattedFiles>>({
      success: true,
      message: '获取文件列表成功',
      data: formattedFiles
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      message: '获取文件列表失败',
      data: null
    }, { status: 500 });
  }
} 