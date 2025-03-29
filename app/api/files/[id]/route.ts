import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';

// 错误响应处理
function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

// 文件更新响应处理
function successResponse(file: any) {
  return NextResponse.json({
    success: true,
    file: {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: file.createdAt,
      tag: file.tag,
      source: file.source,
      isFolder: file.isFolder,
      tags: file.tags,
    }
  });
}

// 获取文件信息
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id }
    });

    if (!file) {
      return errorResponse('文件不存在', 404);
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return errorResponse('获取文件信息失败');
  }
}

// 更新文件信息
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { tag, isFavorite, favoriteFolderId } = body;

    const file = await prisma.file.findUnique({
      where: { id: params.id }
    });

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: {
        ...(tag !== undefined && { tag }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(favoriteFolderId !== undefined && { favoriteFolderId })
      }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('更新文件信息失败:', error);
    return NextResponse.json({ error: '更新文件信息失败' }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    const file = await prisma.file.findUnique({
      where: { id: params.id }
    });

    if (!file) {
      return errorResponse('文件不存在', 404);
    }

    await prisma.file.update({
      where: { id: file.id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('删除文件失败:', error);
    return errorResponse('删除文件失败');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    const body = await request.json();
    const { tag, isFavorite, favoriteFolderId } = body;

    const file = await prisma.file.findUnique({
      where: { id: params.id }
    });

    if (!file) {
      return errorResponse('文件不存在', 404);
    }

    const updateData: Prisma.FileUpdateInput = {};
    if (tag !== undefined) updateData.tags = tag;
    if (isFavorite !== undefined) {
      // 处理收藏逻辑
      if (isFavorite) {
        await prisma.favorite.create({
          data: {
            fileId: file.id,
            userId: session.user.id
          }
        });
      } else {
        await prisma.favorite.deleteMany({
          where: {
            fileId: file.id,
            userId: session.user.id
          }
        });
      }
    }

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: updateData
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('更新文件信息失败:', error);
    return errorResponse('更新文件信息失败');
  }
} 