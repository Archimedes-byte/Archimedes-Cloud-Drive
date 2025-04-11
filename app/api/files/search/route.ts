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
  apiHandler,
  createPaginatedResponse
} from '@/app/lib/api/responseHandler';

// 搜索请求验证模式
const SearchQuerySchema = z.object({
  query: z.string().min(1, '搜索关键词不能为空'),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20)
});

export const dynamic = 'force-dynamic';

/**
 * 文件搜索API
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
      
      const validationResult = SearchQuerySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const { query, type, page, pageSize } = validationResult.data;
      
      // 构建搜索条件
      const searchConditions: any = {
        uploaderId: user.id,
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { filename: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } }
        ]
      };
      
      // 如果指定了文件类型，添加类型过滤
      if (type) {
        if (type === 'folder') {
          searchConditions.isFolder = true;
        } else {
          searchConditions.isFolder = false;
          searchConditions.type = type;
        }
      }
      
      // 计算总数
      const totalCount = await prisma.file.count({
        where: searchConditions
      });
      
      // 执行分页查询
      const searchResults = await prisma.file.findMany({
        where: searchConditions,
        orderBy: [
          { isFolder: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      
      return createPaginatedResponse(
        searchResults,
        totalCount,
        page,
        pageSize,
        '搜索成功'
      );
    } catch (error) {
      console.error('文件搜索错误:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
} 