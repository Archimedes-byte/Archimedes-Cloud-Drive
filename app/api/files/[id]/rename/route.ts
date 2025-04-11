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

// 重命名文件请求验证模式
const RenameFileSchema = z.object({
  name: z.string().min(1, '文件名不能为空'),
});

export const dynamic = 'force-dynamic';

/**
 * 重命名文件API
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const fileId = params.id;
    
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

      // 解析并验证请求数据
      const data = await req.json();
      const validationResult = RenameFileSchema.safeParse(data);
      
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const { name } = validationResult.data;
      
      // 查找文件并验证所有权
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          uploaderId: user.id,
          isDeleted: false
        }
      });
      
      if (!file) {
        return createErrorResponse(
          '文件不存在或无权限访问',
          STATUS_CODES.NOT_FOUND,
          ERROR_CODES.NOT_FOUND
        );
      }
      
      // 检查同名文件是否已存在（在同级目录下）
      const existingFile = await prisma.file.findFirst({
        where: {
          name,
          parentId: file.parentId,
          id: { not: fileId },
          uploaderId: user.id,
          isDeleted: false
        }
      });
      
      if (existingFile) {
        return createErrorResponse(
          '同名文件已存在',
          STATUS_CODES.CONFLICT,
          ERROR_CODES.RESOURCE_EXISTS
        );
      }
      
      // 更新文件名
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          name,
          filename: name,
          updatedAt: new Date()
        }
      });
      
      return createSuccessResponse(
        updatedFile,
        '文件重命名成功'
      );
    } catch (error) {
      console.error('重命名文件错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
} 