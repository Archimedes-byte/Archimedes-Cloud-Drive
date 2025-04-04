import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { ApiResponse, FileInfo, FileListResponse, SearchFilesRequest } from '@/app/shared/types';

export async function GET(request: Request): Promise<NextResponse<FileListResponse>> {
  try {
    // 验证用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false,
          error: '请先登录' 
        },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: '用户不存在' 
        },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type');

    // 构建查询条件
    const where: any = {
      uploaderId: user.id,
      isDeleted: false,
    };

    // 名称搜索
    if (query) {
      where.name = {
        contains: query,
        mode: 'insensitive', // 不区分大小写
      };
    }

    // 类型筛选
    if (type) {
      where.isFolder = false;
      
      if (type === 'image/') {
        where.type = { startsWith: 'image/' };
      } else if (type === 'video/') {
        where.type = { startsWith: 'video/' };
      } else if (type === 'audio/') {
        where.type = { startsWith: 'audio/' };
      } else if (type === 'application/') {
        where.type = { startsWith: 'application/' };
      } else if (type === 'text/') {
        where.type = { startsWith: 'text/' };
      }
    }

    // 获取文件列表
    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      }
    });

    // 格式化返回数据
    const formattedFiles: FileInfo[] = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type || '',
      size: file.size || 0,
      url: file.url || '',
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      parentId: file.parentId,
      tags: file.tags || [],
      isFolder: file.isFolder,
    }));

    return NextResponse.json({
      success: true,
      data: formattedFiles
    });
  } catch (error) {
    console.error('搜索文件失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '搜索文件失败' 
      },
      { status: 500 }
    );
  }
} 