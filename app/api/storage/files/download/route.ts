/**
 * 文件下载API路由
 * 处理文件下载请求
 */
import { NextRequest, NextResponse } from 'next/server';
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { join } from 'path';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { FileInfo } from '@/app/types/domains/fileTypes';
import JSZip from 'jszip';
import { prisma } from '@/app/lib/database';
import { mapFileEntityToFileInfo } from '@/app/services/storage/file-upload-service';
import mime from 'mime-types';

// 上传目录
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 记录文件下载历史
 */
async function recordDownloadHistory(userId: string, fileId: string) {
  try {
    await prisma.downloadHistory.upsert({
      where: {
        userId_fileId: {
          userId,
          fileId
        }
      },
      update: {
        downloadedAt: new Date()
      },
      create: {
        userId,
        fileId,
        downloadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('记录下载历史失败:', error);
  }
}

/**
 * 将数据库文件实体转换为前端FileInfo对象
 */
function mapToFileInfo(file: any): FileInfo {
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
 * 从多个来源确定文件的MIME类型
 * @param fileInfo 文件信息对象
 * @returns 确定的内容类型
 */
async function determineContentType(fileInfo: FileInfo): Promise<string> {
  // 默认内容类型
  let contentType = 'application/octet-stream';
  
  try {
    // 1. 首先尝试使用数据库中存储的文件类型（最可靠）
    if (fileInfo.type && fileInfo.type !== 'folder' && fileInfo.type !== 'unknown') {
      // 判断type是否为MIME类型格式（包含'/'）
      if (typeof fileInfo.type === 'string' && fileInfo.type.includes('/')) {
        contentType = fileInfo.type;
        console.log(`使用数据库记录的文件类型: ${contentType}`);
        return contentType;
      }
    }
    
    // 2. 尝试通过文件扩展名确定MIME类型
    if (fileInfo.extension) {
      const mimeType = mime.lookup(`.${fileInfo.extension}`);
      if (mimeType) {
        contentType = mimeType;
        console.log(`通过文件扩展名确定的MIME类型: ${contentType}`);
        return contentType;
      }
    }
    
    // 3. 尝试通过原始文件名确定MIME类型
    if (fileInfo.name) {
      const mimeType = mime.lookup(fileInfo.name);
      if (mimeType) {
        contentType = mimeType;
        console.log(`通过原始文件名确定的MIME类型: ${contentType}`);
        return contentType;
      }
    }
    
    // 4. 尝试通过文件URL确定MIME类型
    if (fileInfo.url) {
      const urlParts = fileInfo.url.split('/');
      const filenameFromUrl = urlParts[urlParts.length - 1];
      if (filenameFromUrl) {
        const mimeType = mime.lookup(filenameFromUrl);
        if (mimeType) {
          contentType = mimeType;
          console.log(`通过URL确定的MIME类型: ${contentType}`);
          return contentType;
        }
      }
    }
    
    // 5. 尝试通过存储的文件名确定MIME类型
    if (fileInfo.filename) {
      const mimeType = mime.lookup(fileInfo.filename);
      if (mimeType) {
        contentType = mimeType;
        console.log(`通过存储文件名确定的MIME类型: ${contentType}`);
        return contentType;
      }
    }
    
    // 6. 使用默认类型
    console.log(`无法确定文件类型，使用默认值: ${contentType}`);
    return contentType;
  } catch (error) {
    console.error('确定内容类型时出错:', error);
    return 'application/octet-stream'; // 出错时返回默认类型
  }
}

/**
 * 获取文件的存储路径
 * @param fileInfo 文件信息
 * @returns 文件的存储路径或null（如果找不到）
 */
async function getFilePath(fileInfo: FileInfo): Promise<string | null> {
  if (!fileInfo) return null;
  
  let filePath: string | null = null;
  let fileExists = false;
  
  // 1. 尝试使用filename字段（最可靠的方式）
  if (fileInfo.filename) {
    filePath = join(UPLOAD_DIR, fileInfo.filename);
    fileExists = existsSync(filePath);
    if (fileExists) {
      console.log(`使用filename字段找到文件: ${filePath}`);
      return filePath;
    }
  }
  
  // 2. 如果filename不存在或无法找到文件，尝试从URL解析
  if (!fileExists && fileInfo.url) {
    const urlParts = fileInfo.url.split('/');
    const filenameFromUrl = urlParts[urlParts.length - 1];
    if (filenameFromUrl) {
      filePath = join(UPLOAD_DIR, filenameFromUrl);
      fileExists = existsSync(filePath);
      if (fileExists) {
        console.log(`使用URL解析找到文件: ${filePath}`);
        return filePath;
      }
    }
  }
  
  // 3. 尝试使用路径和名称组合
  if (!fileExists && fileInfo.path) {
    try {
      // 去除开头的"/"
      const cleanPath = fileInfo.path.replace(/^\//, '');
      const filenameWithPath = join(cleanPath, fileInfo.name);
      filePath = join(UPLOAD_DIR, filenameWithPath);
      fileExists = existsSync(filePath);
      if (fileExists) {
        console.log(`使用path+name找到文件: ${filePath}`);
        return filePath;
      }
    } catch (pathError) {
      console.error('处理文件路径时出错:', pathError);
    }
  }
  
  // 4. 最后尝试以ID作为文件名
  filePath = join(UPLOAD_DIR, fileInfo.id);
  fileExists = existsSync(filePath);
  if (fileExists) {
    console.log(`使用ID作为文件名找到文件: ${filePath}`);
    return filePath;
  }
  
  return null;
}

/**
 * 递归获取文件夹内所有文件
 * @param userId 用户ID
 * @param folderId 文件夹ID
 * @param relativePath 当前相对路径（用于ZIP文件结构）
 * @returns 包含文件信息和相对路径的对象数组
 */
async function getAllFilesInFolder(
  userId: string, 
  folderId: string, 
  relativePath: string = ''
): Promise<Array<{ fileInfo: FileInfo, relativePath: string }>> {
  try {
    // 直接使用prisma查询文件夹信息
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        isDeleted: false,
        isFolder: true
      }
    });
    
    if (!folder) {
      throw new Error(`ID为 ${folderId} 的项目不是文件夹或不存在`);
    }
    
    const folderInfo = mapFileEntityToFileInfo(folder);
    
    // 直接使用prisma获取文件夹下的所有项目
    const folderContents = await prisma.file.findMany({
      where: {
        parentId: folderId,
        isDeleted: false
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`文件夹 "${folderInfo.name}" (${folderId}) 包含 ${folderContents.length} 个项目`);
    
    // 初始化结果数组
    let allFiles: Array<{ fileInfo: FileInfo, relativePath: string }> = [];
    let folderCount = 0;
    let fileCount = 0;
    
    // 处理文件夹下的每个项目
    for (const item of folderContents) {
      // 如果是文件夹，递归获取其中的文件
      if (item.isFolder) {
        folderCount++;
        const folderName = item.name || `folder_${item.id}`;
        console.log(`处理子文件夹: "${folderName}" (${item.id})`);
        
        // 即使是空文件夹，也在ZIP中创建目录结构
        const folderPath = join(relativePath, folderName);
        
        const nestedFiles = await getAllFilesInFolder(
          userId, 
          item.id, 
          folderPath
        );
        
        // 如果子文件夹是空的，添加一个.empty文件以保留目录结构
        if (nestedFiles.length === 0) {
          console.log(`子文件夹 "${folderName}" 为空，添加占位文件`);
          allFiles.push({
            fileInfo: {
              id: `empty_${item.id}`,
              name: '.empty',
              isFolder: false,
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              type: 'text/plain',
              uploaderId: userId,
              isDeleted: false
            } as FileInfo,
            relativePath: folderPath
          });
        } else {
          console.log(`子文件夹 "${folderName}" 包含 ${nestedFiles.length} 个文件`);
          allFiles = allFiles.concat(nestedFiles);
        }
      } 
      // 如果是文件，添加到结果数组
      else {
        fileCount++;
        allFiles.push({
          fileInfo: mapFileEntityToFileInfo(item),
          relativePath
        });
      }
    }
    
    console.log(`文件夹 "${folderInfo.name}" 统计: ${fileCount} 个文件, ${folderCount} 个子文件夹`);
    return allFiles;
  } catch (error) {
    console.error(`获取文件夹内容时出错: ${folderId}`, error);
    return [];
  }
}

interface DownloadRequest {
  fileIds: string[];
}

// 创建一个专门用于处理文件下载的withAuth包装函数
function withDownloadAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const response = await handler(req);
    return response as any; // 类型断言，因为这里我们返回的是原始响应
  });
}

/**
 * 处理文件下载请求
 * 支持GET和POST方法
 */
export const GET = withDownloadAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const fileIds = searchParams.get('fileIds')?.split(',') || [];
    const folderId = searchParams.get('folderId');

    if (!fileIds.length && !folderId) {
      return createApiErrorResponse('请提供文件ID或文件夹ID');
    }

    // 获取ZIP文件内容
    const { fileName, filePath } = await handleDownload(req.user.id, fileIds, folderId);
    
    // 直接用文件路径返回一个响应
    return await returnFileResponse(filePath, fileName, 'application/zip');
    
  } catch (error) {
    console.error('文件下载失败:', error);
    return createApiErrorResponse('文件下载失败');
  }
});

/**
 * 处理POST请求的文件下载
 */
export const POST = withDownloadAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { fileIds = [], isFolder = false } = body;
    
    if (!fileIds.length) {
      return createApiErrorResponse('请提供文件ID');
    }

    // 如果是文件夹下载，使用第一个ID作为文件夹ID
    const folderId = isFolder ? fileIds[0] : null;
    
    // 获取ZIP文件内容
    const { fileName, filePath } = await handleDownload(req.user.id, fileIds, folderId);
    
    // 直接用文件路径返回一个响应
    return await returnFileResponse(filePath, fileName, 'application/zip');
    
  } catch (error) {
    console.error('文件下载失败:', error);
    return createApiErrorResponse('文件下载失败');
  }
});

/**
 * 处理文件下载的核心逻辑
 * 返回临时文件流而不是Buffer
 */
async function handleDownload(userId: string, fileIds: string[], folderId: string | null): Promise<{ 
  fileName: string;
  filePath: string;
}> {
  // 创建ZIP文件
  const zip = new JSZip();
  const tempFileName = `download-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.zip`;
  const tempFilePath = join(UPLOAD_DIR, 'temp', tempFileName);
  
  // 确保临时目录存在
  const tempDir = join(UPLOAD_DIR, 'temp');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  // 递归处理文件夹内容的函数
  const processFolder = async (folder: any, zipFolder: JSZip, currentPath: string = '') => {
    // 获取文件夹下的所有内容
    const contents = await prisma.file.findMany({
      where: {
        parentId: folder.id,
        isDeleted: false
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' }
      ]
    });

    for (const item of contents) {
      const itemPath = join(currentPath, item.name);
      
      if (item.isFolder) {
        // 创建子文件夹
        const newZipFolder = zipFolder.folder(item.name);
        if (newZipFolder) {
          // 递归处理子文件夹
          await processFolder(item, newZipFolder, itemPath);
        }
      } else {
        // 处理文件 - 直接使用完整的filename
        if (item.filename) {
          const filePath = join(UPLOAD_DIR, item.filename);
          console.log(`尝试读取文件: ${filePath}`);
          
          if (existsSync(filePath)) {
            try {
              const fileContent = await fs.readFile(filePath);
              zipFolder.file(item.name, fileContent);
              // 记录文件下载历史
              await recordDownloadHistory(userId, item.id);
            } catch (error) {
              console.error(`读取文件失败: ${filePath}`, error);
            }
          } else {
            console.error(`文件不存在: ${filePath}`);
          }
        }
      }
    }
  };

  // 处理文件夹下载
  if (folderId) {
    const folder = await prisma.file.findUnique({
      where: { id: folderId },
      include: {
        other_File: {
          select: {
            id: true,
            name: true,
            filename: true,
            isFolder: true,
            path: true
          }
        }
      }
    });

    if (!folder) {
      throw new Error('文件夹不存在');
    }

    if (!folder.isFolder) {
      throw new Error('指定的ID不是文件夹');
    }

    // 从根文件夹开始处理
    await processFolder(folder, zip);
  }

  // 处理单个或多个文件下载
  if (fileIds.length > 0) {
    const files = await prisma.file.findMany({
      where: {
        id: {
          in: fileIds
        },
        isDeleted: false
      }
    });

    for (const file of files) {
      // 跳过主文件夹（如果已经处理过）
      if (folderId && file.id === folderId) {
        continue;
      }
      
      if (file.isFolder) {
        // 处理文件夹 - 在根目录创建文件夹
        const folderInZip = zip.folder(file.name);
        if (folderInZip) {
          // 递归处理文件夹内容
          await processFolder(file, folderInZip, file.name);
        }
      } else if (file.filename) {
        // 处理普通文件 - 直接添加到根目录
        const filePath = join(UPLOAD_DIR, file.filename);
        console.log(`尝试读取文件: ${filePath}`);
        
        if (existsSync(filePath)) {
          try {
            const fileContent = await fs.readFile(filePath);
            // 使用原始文件名，避免重复
            const fileName = file.name || `file_${file.id}`;
            zip.file(fileName, fileContent);
            // 记录文件下载历史
            await recordDownloadHistory(userId, file.id);
          } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error);
          }
        } else {
          console.error(`文件不存在: ${filePath}`);
        }
      }
    }
  }

  // 生成ZIP文件到临时位置
  console.log(`正在生成ZIP文件到临时路径: ${tempFilePath}`);
  
  // 记录ZIP文件的内容结构
  const zipContents = zip.files;
  const fileCount = Object.keys(zipContents).length;
  console.log(`ZIP文件将包含 ${fileCount} 个项目`);
  console.log('ZIP内容清单:');
  Object.keys(zipContents).forEach(path => {
    const isFolder = zipContents[path].dir;
    console.log(`- ${isFolder ? '[文件夹] ' : '[文件] '}${path}`);
  });
  
  const zipContent = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // 提高压缩级别，平衡压缩率和速度
    },
    streamFiles: true // 启用流式处理，减少内存使用
  });

  // 写入临时文件
  await fs.writeFile(tempFilePath, zipContent);
  console.log(`ZIP文件已写入临时位置，大小: ${(zipContent.length / 1024).toFixed(2)} KB`);
  
  // 确定文件名
  const fileName = folderId 
    ? `folder-${folderId}-${Date.now()}.zip` 
    : `files-${Date.now()}.zip`;
  
  // 创建文件流
  const fileStream = createReadStream(tempFilePath);
  
  // 注册文件读取完成后的清理操作
  fileStream.on('end', () => {
    // 延迟删除临时文件，确保文件已被完全读取
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(err => {
        console.error(`删除临时文件失败: ${tempFilePath}`, err);
      });
    }, 1000);
  });
  
  return {
    fileName,
    filePath: tempFilePath
  };
}

/**
 * 直接返回文件响应
 */
async function returnFileResponse(filePath: string, fileName: string, contentType: string): Promise<Response> {
  // 直接读取文件到内存
  const fileBuffer = await fs.readFile(filePath);
  
  // 成功读取文件后，安排稍后删除临时文件
  setTimeout(() => {
    fs.unlink(filePath).catch(err => {
      console.error(`删除临时文件失败: ${filePath}`, err);
    });
  }, 5000);
  
  console.log(`文件已读取，准备返回下载，大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}