import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { ApiResponse, FileInfo, FileEntity, mapFileEntityToFileInfo } from '@/app/types';

// 错误响应处理
function errorResponse(message: string, status: number = 500): NextResponse<ApiResponse> {
  return NextResponse.json({ 
    success: false, 
    error: message 
  }, { status });
}

// 文件更新响应处理
function successResponse(file: FileEntity): NextResponse<ApiResponse<FileInfo>> {
  // 使用类型映射函数
  const fileInfo = mapFileEntityToFileInfo(file);
  
  // 添加扩展名字段
  if (fileInfo.name && !fileInfo.isFolder) {
    const parts = fileInfo.name.split('.');
    if (parts.length > 1) {
      fileInfo.extension = parts[parts.length - 1].toLowerCase();
    }
  }
  
  console.log('正在返回文件信息:', {
    id: fileInfo.id,
    name: fileInfo.name,
    type: fileInfo.type,
    extension: fileInfo.extension,
    isFolder: fileInfo.isFolder
  });
  
  return NextResponse.json({
    success: true,
    data: fileInfo
  });
}

// 获取文件信息
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileInfo>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return errorResponse('用户不存在', 401);
    }

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id,
        uploaderId: user.id
      }
    });

    if (!file) {
      return errorResponse('文件不存在或无权访问', 404);
    }

    return successResponse(file as unknown as FileEntity);
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return errorResponse('获取文件信息失败');
  }
}

// 更新文件信息
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileInfo>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return errorResponse('用户不存在', 401);
    }

    const body = await request.json();
    const { tags } = body;

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id, 
        uploaderId: user.id 
      }
    });

    if (!file) {
      return errorResponse('文件不存在或无权修改', 404);
    }

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: {
        ...(tags !== undefined && { tags })
      }
    });

    return successResponse(updatedFile as unknown as FileEntity);
  } catch (error) {
    console.error('更新文件信息失败:', error);
    return errorResponse('更新文件信息失败');
  }
}

// 删除文件
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return errorResponse('用户不存在', 401);
    }

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id, 
        uploaderId: user.id 
      }
    });

    if (!file) {
      return errorResponse('文件不存在或无权删除', 404);
    }

    await prisma.file.update({
      where: { id: file.id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: '文件删除成功' 
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    return errorResponse('删除文件失败');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<FileInfo>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return errorResponse('未授权', 401);
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return errorResponse('用户不存在', 401);
    }

    const body = await request.json();
    const { tags } = body;

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id, 
        uploaderId: user.id 
      }
    });

    if (!file) {
      return errorResponse('文件不存在或无权修改', 404);
    }

    const updateData: Prisma.FileUpdateInput = {};
    if (tags !== undefined) updateData.tags = tags;

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: updateData
    });

    return successResponse(updatedFile as unknown as FileEntity);
  } catch (error) {
    console.error('更新文件信息失败:', error);
    return errorResponse('更新文件信息失败');
  }
} 