import { z } from 'zod';
import { FileType } from '@/app/types';

// 基础验证规则
const fileTypeSchema = z.enum(['image', 'document', 'video', 'audio', 'other']);
const idSchema = z.string().uuid();
const tagsSchema = z.array(z.string()).optional();

// 文件列表请求验证
export const fileListSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  type: fileTypeSchema.nullable().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// 文件搜索请求验证
export const fileSearchSchema = z.object({
  query: z.string().min(1),
  type: fileTypeSchema.nullable().optional(),
  tags: tagsSchema,
});

// 文件上传请求验证
export const fileUploadSchema = z.object({
  files: z.array(z.any()),
  tags: tagsSchema,
  folderId: z.string().uuid().nullable().optional(),
});

// 文件删除请求验证
export const fileDeleteSchema = z.object({
  fileIds: z.array(idSchema).min(1),
});

// 文件移动请求验证
export const fileMoveSchema = z.object({
  fileIds: z.array(idSchema).min(1),
  targetFolderId: idSchema,
});

// 文件更新请求验证
export const fileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  tags: tagsSchema,
});

// 文件夹创建请求验证
export const folderCreateSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
  tags: tagsSchema,
});

// 验证工具函数
export async function validateRequest<T>(
  schema: z.Schema<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ')
      };
    }
    return { 
      success: false, 
      error: '验证失败' 
    };
  }
} 