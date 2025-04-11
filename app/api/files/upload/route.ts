import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { mkdir } from 'fs/promises';
import { FileResponse } from '@/app/types';
import { STORAGE_CONFIG } from '@/app/lib/config';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  STATUS_CODES, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  apiHandler
} from '@/app/lib/api/responseHandler';
import { 
  saveUploadedFile, 
  createFolderStructure, 
  getFileCategory 
} from '../utils/file-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60; 

// 请求参数验证模式
const UploadFormSchema = z.object({
  folderId: z.string().optional().nullable(),
  isFolderUpload: z.enum(['true', 'false']).optional(),
  tags: z.string().optional(),
});

/**
 * 解析上传的标签
 * @param tagValue 标签值
 * @returns 解析后的标签数组
 */
function parseTags(tagValue: string | null | undefined): string[] {
  if (!tagValue) return [];
  
  try {
    // 尝试解析JSON格式
    const parsedTags = JSON.parse(tagValue);
    if (Array.isArray(parsedTags)) {
      return parsedTags;
    }
  } catch (e) {
    // 如果不是JSON，尝试解析为逗号分隔的字符串
    return tagValue.split(',').map(tag => tag.trim()).filter(Boolean);
  }
  
  return [];
}

/**
 * 提取文件夹上传路径
 * @param formData 表单数据
 * @param filesCount 文件数量
 * @returns 文件索引到路径的映射
 */
function extractFolderPaths(formData: FormData, filesCount: number): Map<number, string> {
  const pathsMap = new Map<number, string>();
  
  for (let i = 0; i < filesCount; i++) {
    const pathKey = `paths_${i}`;
    const pathValue = formData.get(pathKey);
    if (typeof pathValue === 'string') {
      pathsMap.set(i, pathValue);
    }
  }
  
  return pathsMap;
}

/**
 * 处理文件上传并创建记录
 * @param file 上传的文件
 * @param userId 用户ID
 * @param parentId 父文件夹ID
 * @param tags 标签数组
 * @param relativePath 相对路径(用于文件夹上传)
 * @returns 创建的文件记录
 */
async function processFileUpload(
  file: File, 
  userId: string, 
  parentId: string | null, 
  tags: string[],
  relativePath?: string
): Promise<FileResponse> {
  let targetParentId = parentId;
  
  // 如果有相对路径，创建必要的文件夹结构
  if (relativePath && relativePath.includes('/')) {
    const pathParts = relativePath.split('/');
    const dirPath = pathParts.slice(0, -1).join('/');
    
    if (dirPath) {
      // 创建文件夹结构并获取最后一级文件夹ID作为父ID
      targetParentId = await createFolderStructure(userId, dirPath, parentId);
    }
  }
  
  // 保存文件并创建记录
  const fileRecord = await saveUploadedFile(file, userId, targetParentId, tags);
  
  return {
    id: fileRecord.id,
    name: fileRecord.name,
    type: fileRecord.type || null,
    size: fileRecord.size,
    isFolder: fileRecord.isFolder,
    createdAt: fileRecord.createdAt.toISOString(),
    updatedAt: fileRecord.updatedAt.toISOString(),
    parentId: fileRecord.parentId,
    tags: fileRecord.tags as string[],
    url: fileRecord.url || ''
  };
}

/**
 * 文件上传API处理函数
 */
export async function POST(req: NextRequest) {
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

    try {
      // 解析表单数据
      const formData = await req.formData();
      
      // 验证表单参数
      const rawParams: Record<string, string> = {};
      ['folderId', 'isFolderUpload', 'tags'].forEach(key => {
        const value = formData.get(key);
        if (value && typeof value === 'string') {
          rawParams[key] = value;
        }
      });
      
      const validationResult = UploadFormSchema.safeParse(rawParams);
      if (!validationResult.success) {
        return createErrorResponse(
          validationResult.error,
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      
      const { folderId, isFolderUpload } = validationResult.data;
      const tags = parseTags(validationResult.data.tags);
      
      // 兼容两种命名方式：'file'和'files'
      let files: File[] = [];
      const fileEntries = formData.getAll('file');
      const filesEntries = formData.getAll('files');
      
      if (fileEntries.length > 0) {
        files = fileEntries as File[];
      } else if (filesEntries.length > 0) {
        files = filesEntries as File[];
      }
      
      if (files.length === 0) {
        return createErrorResponse(
          '未找到文件',
          STATUS_CODES.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          { files: ['请确保正确选择了文件并且表单字段名称为"file"或"files"'] }
        );
      }
      
      // 检查用户剩余存储空间
      const totalFileSize = files.reduce((size, file) => size + file.size, 0);
      if (user.storageUsed + totalFileSize > user.storageLimit) {
        return createErrorResponse(
          '存储空间不足',
          STATUS_CODES.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        );
      }

      // 确保上传目录存在
      await mkdir(STORAGE_CONFIG.UPLOAD_PATH, { recursive: true });
      
      // 获取文件路径信息（用于文件夹上传）
      const isFolderUploadMode = isFolderUpload === 'true';
      const pathsMap = isFolderUploadMode 
        ? extractFolderPaths(formData, files.length)
        : new Map<number, string>();
      
      // 处理所有上传的文件
      const uploadPromises = files.map((file, index) => {
        const relativePath = pathsMap.get(index);
        return processFileUpload(file, user.id, folderId || null, tags, relativePath);
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);

      // 返回上传结果
      return createSuccessResponse(
        { files: uploadedFiles },
        '文件上传成功'
      );
    } catch (error) {
      console.error('文件上传失败:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误',
        STATUS_CODES.INTERNAL_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  });
} 