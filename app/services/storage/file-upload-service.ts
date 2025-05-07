/**
 * 文件上传服务
 * 提供文件上传、存储和处理的功能
 */
import { prisma } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { getFileCategory, generateUniqueFilename, sanitizeFilename } from '@/app/utils/file';
import { FileInfo, FileEntity } from '@/app/types';
import { createFileError, handleError, withRetry } from '@/app/utils/error';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * 将文件实体转换为前端FileInfo对象
 */
export function mapFileEntityToFileInfo(file: FileEntity): FileInfo {
  return {
    id: file.id,
    name: file.name,
    type: file.type || 'unknown',
    size: file.size || 0,
    isFolder: file.isFolder,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    path: file.path,
    parentId: file.parentId,
    tags: file.tags || [],
    url: file.url || undefined,
  };
}

/**
 * 文件上传服务类
 * 负责处理文件的上传、存储和相关处理
 */
export class FileUploadService {
  
  /**
   * 确保上传目录存在
   */
  private async ensureUploadDirectory(): Promise<void> {
    if (!existsSync(UPLOAD_DIR)) {
      console.log(`[上传服务] 上传目录不存在，创建目录: ${UPLOAD_DIR}`);
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
  }
  
  /**
   * 验证父文件夹是否存在和用户权限
   */
  private async validateParentFolder(folderId: string | null, userId: string): Promise<any> {
    if (!folderId) return null;
    
    console.log(`[上传服务] 验证父文件夹: ${folderId}`);
    
    const parentFolder = await prisma.file.findFirst({
      where: {
        id: folderId,
        uploaderId: userId,
        isFolder: true,
        isDeleted: false,
      },
    });

    if (!parentFolder) {
      console.error(`[上传服务] 父文件夹不存在或无权限访问: ${folderId}`);
      throw createFileError('access', '父文件夹不存在或无权限访问');
    }
    
    console.log(`[上传服务] 父文件夹验证成功，路径: ${parentFolder.path}`);
    return parentFolder;
  }
  
  /**
   * 处理标签数组，去除重复和空标签
   */
  private processTags(tags: string[] = []): string[] {
    return Array.isArray(tags)
      ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
      : [];
  }

  /**
   * 上传文件
   */
  async uploadFile(
    userId: string,
    file: {
      name: string;
      type: string;
      size: number;
      arrayBuffer: () => Promise<ArrayBuffer>;
    },
    folderId: string | null = null,
    tags: string[] = [],
    originalFileName?: string
  ): Promise<FileInfo> {
    console.log(`[上传服务] 开始处理文件上传：${originalFileName || file.name}`);
    const startTime = Date.now();
    
    try {
      // 确保上传目录存在
      await this.ensureUploadDirectory();

      // 使用提供的原始文件名或默认的文件名
      const fileName = originalFileName || file.name;
      console.log(`[上传服务] 使用文件名: ${fileName}`);
      
      // 清理文件名
      const originalName = sanitizeFilename(fileName);
      console.log(`[上传服务] 清理后的文件名: ${originalName}`);
      
      // 获取文件扩展名
      const extension = extname(originalName).substring(1);
      console.log(`[上传服务] 文件扩展名: ${extension || '无'}`);
      
      // 生成唯一文件名
      const uniqueFilename = generateUniqueFilename(originalName);
      console.log(`[上传服务] 生成唯一文件名: ${uniqueFilename}`);
      
      // 完整的文件存储路径
      const filePath = join(UPLOAD_DIR, uniqueFilename);
      console.log(`[上传服务] 文件将保存到: ${filePath}`);
      
      // 写入文件
      console.log(`[上传服务] 开始读取文件内容缓冲区, 文件大小: ${(file.size / 1024).toFixed(2)} KB`);
      console.time('[上传服务] 文件缓冲区读取时间');
      const buffer = await file.arrayBuffer();
      console.timeEnd('[上传服务] 文件缓冲区读取时间');
      
      console.log(`[上传服务] 开始写入文件`);
      console.time('[上传服务] 文件写入时间');
      
      // 使用重试机制写入文件
      await withRetry(
        () => writeFile(filePath, Buffer.from(buffer)),
        { 
          retries: 2,
          onRetry: (e, attempt) => console.log(`[上传服务] 文件写入重试: ${attempt}, 错误: ${e.message}`)
        }
      );
      
      console.timeEnd('[上传服务] 文件写入时间');
      console.log(`[上传服务] 文件写入完成`);

      // 获取文件类别
      const fileCategory = getFileCategory(file.type, extension);
      console.log(`[上传服务] 文件类别: ${fileCategory}, MIME类型: ${file.type}`);

      // 验证父文件夹
      const parentFolder = await this.validateParentFolder(folderId, userId);

      // 处理标签
      const uniqueTags = this.processTags(tags);
      console.log(`[上传服务] 处理后的标签: ${uniqueTags.join(', ') || '无'}`);

      // 构建文件URL
      const fileUrl = `/api/storage/files/serve/${uniqueFilename}`;
      console.log(`[上传服务] 文件URL: ${fileUrl}`);

      // 保存文件记录到数据库
      console.log('[上传服务] 开始保存文件记录到数据库');
      console.time('[上传服务] 数据库记录创建时间');
      
      // 创建文件记录
      const fileId = uuidv4();
      const fileRecord = await prisma.file.create({
        data: {
          id: fileId,
          name: originalName,
          filename: uniqueFilename,
          type: fileCategory,
          size: file.size,
          isFolder: false,
          uploaderId: userId,
          parentId: folderId,
          path: parentFolder ? parentFolder.path : '/',
          tags: uniqueTags,
          url: fileUrl,
          updatedAt: new Date(),
        },
      }).catch((err) => {
        console.error(`[上传服务] 创建数据库记录失败:`, err);
        // 删除已上传的文件
        unlink(filePath).catch((unlinkErr) => {
          console.error(`[上传服务] 清理文件失败: ${unlinkErr.message}`);
        });
        throw err;
      });
      
      console.timeEnd('[上传服务] 数据库记录创建时间');
      console.log(`[上传服务] 文件记录已保存，文件ID: ${fileRecord.id}`);

      const fileInfo = mapFileEntityToFileInfo(fileRecord);
      
      const elapsed = Date.now() - startTime;
      console.log(`[上传服务] 文件上传处理完成，总耗时: ${elapsed}ms`);
      
      return fileInfo;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[上传服务] 文件上传失败，耗时: ${elapsed}ms, 错误:`, error);
      throw createFileError('upload', '文件上传失败，请重试', { originalError: error });
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<FileInfo> {
    console.log(`[上传服务] 开始创建文件夹: ${name}`);
    const startTime = Date.now();
    
    try {
      // 清理文件夹名称
      const sanitizedName = sanitizeFilename(name);
      
      if (!sanitizedName || sanitizedName.trim() === '') {
        throw createFileError('upload', '文件夹名称不能为空');
      }
      
      // 验证父文件夹
      const parentFolder = await this.validateParentFolder(parentId, userId);
      
      // 处理标签
      const uniqueTags = this.processTags(tags);
      
      // 检查同名文件夹
      const existingFolder = await prisma.file.findFirst({
        where: {
          name: sanitizedName,
          parentId,
          uploaderId: userId,
          isFolder: true,
          isDeleted: false,
        },
      });

      if (existingFolder) {
        throw createFileError('upload', `文件夹 "${sanitizedName}" 已存在`);
      }

      // 生成文件夹路径
      const folderPath = parentFolder 
        ? `${parentFolder.path === '/' ? '' : parentFolder.path}/${sanitizedName}`
        : `/${sanitizedName}`;

      // 创建文件夹记录
      const folderId = uuidv4();
      const folder = await prisma.file.create({
        data: {
          id: folderId,
          name: sanitizedName,
          filename: '', // 文件夹没有物理文件名
          isFolder: true,
          uploaderId: userId,
          parentId,
          path: folderPath,
          tags: uniqueTags,
          updatedAt: new Date(),
        },
      });
      
      const fileInfo = mapFileEntityToFileInfo(folder);
      
      const elapsed = Date.now() - startTime;
      console.log(`[上传服务] 文件夹创建完成，ID: ${folder.id}, 耗时: ${elapsed}ms`);
      
      return fileInfo;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[上传服务] 文件夹创建失败，耗时: ${elapsed}ms, 错误:`, error);
      
      if (error.type === 'file_access' || error.type === 'file_upload') {
        throw error;
      }
      
      throw createFileError('upload', '创建文件夹失败', { originalError: error });
    }
  }
} 