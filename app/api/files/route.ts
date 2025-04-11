import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  STATUS_CODES, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  apiHandler
} from '@/app/lib/api/responseHandler';

// 定义请求参数验证模式
const QuerySchema = z.object({
  folderId: z.string().optional(),
  type: z.string().optional(),
  recursive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional()
});

export const dynamic = 'force-dynamic';

/**
 * 获取文件列表
 */
export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    try {
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

      // 解析并验证请求参数
      const url = new URL(req.url);
      const rawParams = Object.fromEntries(url.searchParams.entries());
      
      const validationResult = QuerySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const { folderId, type, recursive, page = 1, pageSize = 50 } = validationResult.data;
      const isRecursive = recursive === 'true';
      
      // 构建查询条件
      const where: any = {
        uploaderId: user.id,
        isDeleted: false
      };
      
      // 处理文件夹过滤
      if (folderId) {
        where.parentId = folderId;
      } else if (!isRecursive) {
        where.parentId = null; // 根目录文件
      }
      
      // 处理文件类型过滤
      if (type) {
        // 如果是文件夹类型
        if (type === 'folder') {
          where.isFolder = true;
        } else {
          where.isFolder = false;
          where.type = type;
        }
      }
      
      // 如果是递归查询，使用原生SQL以提高性能
      let files = [];
      
      if (isRecursive && type && type !== 'folder') {
        // 计算总数
        const totalCount = await prisma.file.count({ where });
        
        // 执行分页查询
        files = await prisma.file.findMany({
          where,
          orderBy: [
            { isFolder: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
        });
        
        return createSuccessResponse(
          {
            data: files,
            total: totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
          },
          '文件列表获取成功'
        );
      } else {
        // 标准查询
        const totalCount = await prisma.file.count({ where });
        
        files = await prisma.file.findMany({
          where,
          orderBy: [
            { isFolder: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
        });
        
        return createSuccessResponse(
          {
            data: files,
            total: totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
          },
          '文件列表获取成功'
        );
      }
    } catch (error) {
      console.error('获取文件列表错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
}

/**
 * 批量删除文件
 */
export async function DELETE(req: NextRequest) {
  return apiHandler(async () => {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse(
        ERROR_MESSAGES.UNAUTHORIZED,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    try {
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

      // 解析请求体
      const data = await req.json();
      
      // 验证请求参数
      const DeleteSchema = z.object({
        fileIds: z.array(z.string()).nonempty('请提供要删除的文件ID')
      });
      
      const validationResult = DeleteSchema.safeParse(data);
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const { fileIds } = validationResult.data;
      
      // 验证文件所有权
      const filesToDelete = await prisma.file.findMany({
        where: {
          id: { in: fileIds },
          uploaderId: user.id,
        },
      });
      
      if (filesToDelete.length === 0) {
        return createErrorResponse(
          '未找到要删除的文件或无权限删除',
          STATUS_CODES.NOT_FOUND,
          ERROR_CODES.NOT_FOUND
        );
      }
      
      // 检查是否有未授权的文件
      if (filesToDelete.length !== fileIds.length) {
        return createErrorResponse(
          '部分文件无法删除，可能是权限不足或文件不存在',
          STATUS_CODES.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        );
      }
      
      // 执行软删除
      await prisma.file.updateMany({
        where: {
          id: { in: fileIds },
          uploaderId: user.id,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      
      return createSuccessResponse(
        { deletedCount: filesToDelete.length },
        '文件删除成功'
      );
    } catch (error) {
      console.error('删除文件错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
} 