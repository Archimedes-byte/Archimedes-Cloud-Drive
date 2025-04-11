import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { FileInfo, FileEntity, mapFileEntityToFileInfo } from '@/app/types';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  STATUS_CODES, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  apiHandler
} from '@/app/lib/api/responseHandler';

// 文件更新响应处理
function mapFileToResponse(file: FileEntity): FileInfo {
  // 使用类型映射函数
  const fileInfo = mapFileEntityToFileInfo(file);
  
  // 添加扩展名字段
  if (fileInfo.name && !fileInfo.isFolder) {
    const parts = fileInfo.name.split('.');
    if (parts.length > 1) {
      fileInfo.extension = parts[parts.length - 1].toLowerCase();
    }
  }
  
  return fileInfo;
}

// 获取文件信息
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return createErrorResponse(
        '用户不存在',
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id,
        uploaderId: user.id
      }
    });

    if (!file) {
      return createErrorResponse(
        '文件不存在或无权访问',
        STATUS_CODES.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    const fileInfo = mapFileToResponse(file as unknown as FileEntity);
    return createSuccessResponse(fileInfo, '获取文件信息成功');
  });
}

// 更新文件信息
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return createErrorResponse(
        '用户不存在',
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
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
      return createErrorResponse(
        '文件不存在或无权修改', 
        STATUS_CODES.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: {
        ...(tags !== undefined && { tags })
      }
    });

    const fileInfo = mapFileToResponse(updatedFile as unknown as FileEntity);
    return createSuccessResponse(fileInfo, '文件信息更新成功');
  });
}

// 删除文件
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return createErrorResponse(
        '用户不存在',
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const file = await prisma.file.findFirst({
      where: { 
        id: params.id, 
        uploaderId: user.id 
      }
    });

    if (!file) {
      return createErrorResponse(
        '文件不存在或无权删除',
        STATUS_CODES.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    await prisma.file.update({
      where: { id: file.id },
      data: { isDeleted: true }
    });

    return createSuccessResponse(null, '文件删除成功');
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return createErrorResponse(
        '用户不存在',
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
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
      return createErrorResponse(
        '文件不存在或无权修改',
        STATUS_CODES.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    const updateData: Prisma.FileUpdateInput = {};
    if (tags !== undefined) updateData.tags = tags;

    const updatedFile = await prisma.file.update({
      where: { id: file.id },
      data: updateData
    });

    const fileInfo = mapFileToResponse(updatedFile as unknown as FileEntity);
    return createSuccessResponse(fileInfo, '文件信息更新成功');
  });
} 