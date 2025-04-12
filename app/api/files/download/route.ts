import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { createReadStream } from 'fs';
import { join } from 'path';
import { stat } from 'fs/promises';
import { ApiResponse } from '@/app/types';

export async function POST(request: Request): Promise<NextResponse> {
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

    const { fileIds } = await request.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '请选择要下载的文件' 
        },
        { status: 400 }
      );
    }

    // 获取文件信息
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: {
          equals: session.user.id
        }
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '未找到文件' 
        },
        { status: 404 }
      );
    }

    // 如果只有一个文件，直接返回文件流
    if (files.length === 1) {
      const file = files[0];
      const filePath = join(process.cwd(), file.path);
      const stats = await stat(filePath);
      
      const headers = new Headers();
      headers.set('Content-Type', file.type || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      headers.set('Content-Length', stats.size ? stats.size.toString() : '0');

      const stream = createReadStream(filePath);
      return new NextResponse(stream as any, { headers });
    }

    // TODO: 如果是多个文件，需要创建zip文件
    return NextResponse.json(
      { 
        success: false,
        error: '暂不支持多文件下载' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('下载错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '下载失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
} 