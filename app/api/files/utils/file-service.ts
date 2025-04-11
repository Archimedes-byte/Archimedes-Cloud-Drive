/**
 * 文件服务模块
 * 
 * 提供文件操作相关功能，包括：
 * - 根据类型分类文件
 * - 构建文件路径
 * - 处理文件上传
 * - 处理文件夹结构创建
 */

import { prisma } from '@/app/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileType } from '@/app/types';

/**
 * 根据MIME类型和扩展名确定文件分类
 */
export function getFileCategory(mimeType: string, extension: string): FileType {
  // 图片类型
  if (mimeType.startsWith('image')) {
    return 'image';
  }
  
  // 视频类型
  if (mimeType.startsWith('video')) {
    return 'video';
  }
  
  // 音频类型
  if (mimeType.startsWith('audio')) {
    return 'audio';
  }
  
  // 文档类型
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    mimeType.startsWith('application/vnd.ms-excel') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
    mimeType.startsWith('application/vnd.ms-powerpoint') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml') ||
    mimeType.startsWith('text')
  ) {
    return 'document';
  }
  
  // 压缩文件类型
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip' ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension.toLowerCase())
  ) {
    return 'archive';
  }
  
  // 默认为其他类型
  return 'other';
}

/**
 * 为文件添加完整路径信息
 */
export async function addPathInfoToFiles(files: any[], userId: string) {
  // 获取所有文件夹信息用于构建路径
  const allFolders = await prisma.file.findMany({
    where: {
      uploaderId: userId,
      isFolder: true,
      isDeleted: false
    },
    select: {
      id: true,
      name: true,
      parentId: true
    }
  });

  // 构建文件夹映射
  const folderMap = new Map(allFolders.map(folder => [folder.id, folder]));

  // 为每个文件添加完整路径信息
  const processedItems = files.map(item => {
    let currentParentId = item.parentId;
    const pathParts = [];

    // 递归构建路径
    while (currentParentId) {
      const parentFolder = folderMap.get(currentParentId);
      if (parentFolder) {
        pathParts.unshift(parentFolder.name);
        currentParentId = parentFolder.parentId;
      } else {
        break;
      }
    }

    const fullPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';

    // 创建包含所有原始属性的新对象，并添加显示路径属性
    return {
      ...item,
      displayPath: fullPath ? `${fullPath}/${item.name}` : item.name
    };
  });

  // 按路径排序
  return processedItems.sort((a, b) => 
    (a.displayPath || '').localeCompare(b.displayPath || ''));
}

/**
 * 构建文件查询条件
 */
export function buildFileQueryCondition(userId: string, folderId: string | null, type: string | null) {
  // 基础查询条件
  const where: any = {
    uploaderId: userId,
    isDeleted: false,
  };

  // 如果指定了类型，进行类型筛选
  if (type) {
    if (type === 'folder') {
      // 如果请求的是文件夹类型
      where.isFolder = true;
    } else {
      where.isFolder = false;
      
      if (type === 'image') {
        where.type = { startsWith: 'image' };
      } else if (type === 'video') {
        where.type = { startsWith: 'video' };
      } else if (type === 'audio') {
        where.OR = [
          { type: "audio" },
          { type: { startsWith: 'audio/' } }
        ];
      } else if (type === 'document') {
        where.OR = [
          { type: "document" },
          { type: { startsWith: 'application/pdf' } },
          { type: { startsWith: 'application/msword' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.wordprocessingml' } },
          { type: { startsWith: 'application/vnd.ms-excel' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.spreadsheetml' } },
          { type: { startsWith: 'application/vnd.ms-powerpoint' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.presentationml' } },
          { type: { startsWith: 'text' } }
        ];
      } else if (type === 'archive') {
        where.OR = [
          { type: "archive" },
          {
            type: {
              in: [
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed',
                'application/x-compressed',
                'application/x-tar',
                'application/gzip'
              ]
            }
          }
        ];
      } else {
        // 其他类型
        where.OR = [
          {
            // 排除已知类型
            AND: [
              { type: { not: { startsWith: 'image' } } },
              { type: { not: { startsWith: 'video' } } },
              { type: { not: { startsWith: 'audio' } } },
              { type: { not: { startsWith: 'application/pdf' } } },
              { type: { not: { startsWith: 'application/msword' } } },
              { type: { not: { startsWith: 'application/vnd.openxmlformats-officedocument' } } },
              { type: { not: { startsWith: 'application/vnd.ms-' } } },
              { type: { not: { startsWith: 'text' } } },
              { type: { not: 'document' } }
            ]
          }
        ];
      }
    }
  } else {
    // 如果没有指定类型，则显示当前文件夹下的内容
    where.parentId = folderId || null;
  }

  return where;
}

/**
 * 保存上传的文件
 */
export async function saveUploadedFile(
  file: File,
  userId: string,
  parentId: string | null,
  tags: string[] = []
) {
  // 保存文件
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 确保上传目录存在
  const uploadDir = join(process.cwd(), 'uploads');
  await mkdir(uploadDir, { recursive: true });

  // 生成唯一文件名并保留原始文件名
  const originalFilename = file.name;
  const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = join(uploadDir, uniqueFilename);
  
  // 写入文件
  await writeFile(filePath, buffer);

  // 提取文件扩展名
  const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || '';
  
  // 确定文件类型
  const fileType = getFileCategory(file.type, fileExtension);
  
  // 创建文件记录
  const fileId = uuidv4();
  const fileRecord = await prisma.file.create({
    data: {
      id: fileId,
      name: originalFilename,
      filename: uniqueFilename,
      path: filePath,
      type: file.type || fileType,
      size: file.size,
      parentId: parentId,
      uploaderId: userId,
      tags: tags,
      url: `/api/files/serve/${fileId}`,
      updatedAt: new Date()
    }
  });

  // 更新用户存储使用量
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: { increment: file.size }
    }
  });

  return fileRecord;
}

/**
 * 创建文件夹结构
 */
export async function createFolderStructure(
  userId: string,
  relativePath: string,
  parentId: string | null
) {
  // 从相对路径解析文件夹结构
  const pathParts = relativePath.split('/').filter(part => part);
  
  // 如果没有路径，返回原始父ID
  if (pathParts.length === 0) {
    return parentId;
  }
  
  let currentParentId = parentId;
  
  // 遍历路径，逐级创建文件夹（如果不存在）
  for (let i = 0; i < pathParts.length; i++) {
    const folderName = pathParts[i];
    
    // 检查文件夹是否已存在
    const existingFolder = await prisma.file.findFirst({
      where: {
        name: folderName,
        parentId: currentParentId,
        uploaderId: userId,
        isFolder: true,
        isDeleted: false
      }
    });
    
    if (existingFolder) {
      currentParentId = existingFolder.id;
    } else {
      // 创建新文件夹
      const pathSoFar = pathParts.slice(0, i + 1).join('/');
      const newFolder = await prisma.file.create({
        data: {
          id: uuidv4(),
          name: folderName,
          filename: folderName,
          path: pathSoFar,
          parentId: currentParentId,
          uploaderId: userId,
          isFolder: true,
          type: 'folder',
          size: 0,
          url: '',
          updatedAt: new Date()
        }
      });
      
      currentParentId = newFolder.id;
    }
  }
  
  return currentParentId;
} 