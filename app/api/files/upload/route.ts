import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileResponse } from '@/app/types';
import { STORAGE_CONFIG } from '@/app/lib/config';
import { getStoragePath, generateUniqueFilename, generateFileUrl } from '@/app/lib/file/paths';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60; 

/**
 * 根据MIME类型和文件名确定文件分类
 * @param mimeType 文件的MIME类型
 * @param fileName 文件名称（用于获取扩展名）
 * @returns 文件类型
 */
function getFileType(mimeType: string, fileName: string = ''): string {
  // 获取文件扩展名
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // 使用MIME类型和扩展名的综合判断
  
  // 1. 图片类型判断
  if (mimeType.startsWith('image') || 
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
    return 'image';
  }
  
  // 2. 视频类型判断
  if (mimeType.startsWith('video') || 
      ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'ogv'].includes(ext)) {
    return 'video';
  }
  
  // 3. 音频类型判断
  if (mimeType.startsWith('audio') || 
      ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
    return 'audio';
  }
  
  // 4. 文档类型判断 - Office文档、PDF和文本文件
  if (mimeType.startsWith('application/pdf') || 
      mimeType.startsWith('application/msword') || 
      mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
      mimeType.startsWith('application/vnd.ms-excel') ||
      mimeType.startsWith('application/vnd.ms-powerpoint') ||
      mimeType.startsWith('text/') ||
      ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'md'].includes(ext)) {
    return 'document';
  }
      
  // 5. 压缩文件类型判断
  if (mimeType.startsWith('application/zip') || 
      mimeType.startsWith('application/x-rar') ||
      mimeType.startsWith('application/x-7z') ||
      mimeType.startsWith('application/x-compressed') ||
      mimeType.startsWith('application/x-tar') ||
      mimeType.startsWith('application/gzip') ||
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive';
  }
  
  // 6. 代码文件类型判断
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'html', 'css', 'xml', 'json'].includes(ext)) {
    return 'code';
  }
  
  // 7. 如果无法判断，返回其他类型
  return 'other';
}

/**
 * 文件上传API处理函数
 */
export async function POST(req: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    // 解析表单数据
    const formData = await req.formData();
    
    // 兼容两种命名方式：'file'和'files'
    let files: File[] = [];
    const fileEntries = formData.getAll('file');
    const filesEntries = formData.getAll('files');
    
    if (fileEntries.length > 0) {
      files = fileEntries as File[];
    } else if (filesEntries.length > 0) {
      files = filesEntries as File[];
    }
    
    // 处理标签
    let tags: string[] = [];
    if (formData.has('tags')) {
      const tagsValue = formData.get('tags');
      if (typeof tagsValue === 'string') {
        // 处理逗号分隔的标签字符串
        tags = tagsValue.split(',').map(tag => tag.trim()).filter(Boolean);
      } else if (tagsValue) {
        // 处理JSON格式的标签
        try {
          const parsedTags = JSON.parse(tagsValue.toString());
          if (Array.isArray(parsedTags)) {
            tags = parsedTags;
          }
        } catch (e) {
          console.warn('解析标签失败:', e);
        }
      }
    }
    
    const folderId = formData.get('folderId') as string | null;
    const isFolderUpload = formData.get('isFolderUpload') === 'true';

    // 获取文件路径信息（用于文件夹上传）
    const pathsMap = new Map<number, string>();
    if (isFolderUpload) {
      // 简化路径处理，仅查找以paths_开头的字段
      for (let i = 0; i < files.length; i++) {
        const pathKey = `paths_${i}`;
        const pathValue = formData.get(pathKey);
        if (typeof pathValue === 'string') {
          pathsMap.set(i, pathValue);
        }
      }
    }

    // 记录调试信息
    console.log(`收到上传请求: ${files.length}个文件, 文件夹上传=${isFolderUpload}, 标签数量=${tags.length}, 路径信息数量=${pathsMap.size}`);
    
    if (files.length === 0) {
      return NextResponse.json({ 
        error: '未找到文件', 
        details: '请确保正确选择了文件并且表单字段名称为"file"或"files"' 
      }, { status: 400 });
    }

    // 确保上传目录存在
    await mkdir(STORAGE_CONFIG.UPLOAD_PATH, { recursive: true });

    // 为文件夹上传创建文件夹结构
    const folderCache = new Map<string, string>(); // 路径到文件夹ID的映射
    
    // 处理所有上传的文件
    const uploadedFiles: FileResponse[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 生成唯一文件ID和文件名
      const fileId = uuidv4();
      const originalName = file.name;
      // 使用basename获取不包含路径的纯文件名
      const pureFileName = originalName.includes('/') ? 
        originalName.split('/').pop() || originalName : 
        originalName;
      const uniqueFileName = generateUniqueFilename(pureFileName);
      
      // 创建存储文件路径
      const filePath = getStoragePath(uniqueFileName);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // 保存文件到磁盘
      await writeFile(filePath, fileBuffer);
      
      // 确定文件类型
      const fileType = getFileType(file.type, pureFileName);
      const fileSize = fileBuffer.length;
      const fileUrl = generateFileUrl(fileId);

      // 处理文件夹结构（如果是文件夹上传模式）
      let parentId = folderId;
      
      if (isFolderUpload && pathsMap.has(i)) {
        const relativePath = pathsMap.get(i) as string;
        // 如果有路径信息，则分割路径并创建对应的文件夹结构
        if (relativePath && relativePath.includes('/')) {
          const pathParts = relativePath.split('/').filter(Boolean);
          
          if (pathParts.length > 0) {
            let currentPath = '';
            let currentParentId = folderId;
            
            // 逐级创建文件夹
            for (let j = 0; j < pathParts.length - 1; j++) {
              const folderName = pathParts[j];
              currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
              
              // 检查此路径的文件夹是否已创建
              if (folderCache.has(currentPath)) {
                currentParentId = folderCache.get(currentPath) as string;
                continue;
              }
              
              // 检查数据库中是否已存在此文件夹
              let folder = await prisma.file.findFirst({
                where: {
                  name: folderName,
                  parentId: currentParentId,
                  uploaderId: user.id,
                  isFolder: true,
                  isDeleted: false
                }
              });
              
              // 如果不存在，则创建文件夹
              if (!folder) {
                const folderId = uuidv4();
                folder = await prisma.file.create({
                  data: {
                    id: folderId,
                    name: folderName,
                    filename: folderName,
                    path: `/${currentPath}`,
                    type: 'folder',
                    size: 0,
                    isFolder: true,
                    uploaderId: user.id,
                    parentId: currentParentId,
                    tags: tags,
                    url: null,
                    updatedAt: new Date()
                  }
                });
              }
              
              // 缓存文件夹ID
              folderCache.set(currentPath, folder.id);
              currentParentId = folder.id;
            }
            
            // 设置文件的父文件夹ID
            parentId = currentParentId;
          }
        }
      }

      // 创建文件数据库记录
      const fileRecord = await prisma.file.create({
        data: {
          id: fileId,
          name: pureFileName,
          filename: uniqueFileName,
          path: filePath,
          type: fileType,
          size: fileSize,
          isFolder: false,
          uploaderId: user.id,
          parentId: parentId,
          tags: tags,
          url: fileUrl,
          updatedAt: new Date()
        }
      });

      // 添加到上传结果
      uploadedFiles.push({
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
      });
    }

    // 返回上传结果
    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 