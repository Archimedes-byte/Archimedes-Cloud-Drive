/**
 * 文件下载API路由
 * 处理文件下载请求
 */
import { 
  withAuth, 
  AuthenticatedRequest, 
  createApiResponse, 
  createApiErrorResponse 
} from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { join } from 'path';
import path from 'path';
import mime from 'mime-types';
import { FileInfo, FileTypeEnum } from '@/app/types';
import JSZip from 'jszip';

const storageService = new StorageService();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  fs.mkdir(UPLOAD_DIR, { recursive: true }).catch((err: Error) => {
    console.error('创建上传目录失败:', err);
  });
}

/**
 * 从多个来源确定文件的MIME类型
 * @param fileInfo 文件信息对象
 * @param filePath 文件路径
 * @returns 确定的内容类型
 */
async function determineContentType(fileInfo: FileInfo, filePath: string): Promise<string> {
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
    // 获取文件夹信息
    const folderInfo = await storageService.getFile(userId, folderId);
    if (!folderInfo || !folderInfo.isFolder) {
      throw new Error(`ID为 ${folderId} 的项目不是文件夹或不存在`);
    }
    
    // 获取文件夹下的所有项目
    const folderContentsResponse = await storageService.getFiles(userId, folderId);
    const folderContents = folderContentsResponse.items || [];
    
    // 初始化结果数组
    let allFiles: Array<{ fileInfo: FileInfo, relativePath: string }> = [];
    
    // 处理文件夹下的每个项目
    for (const item of folderContents) {
      // 如果是文件夹，递归获取其中的文件
      if (item.isFolder) {
        const folderName = item.name || `folder_${item.id}`;
        const nestedFiles = await getAllFilesInFolder(
          userId, 
          item.id, 
          join(relativePath, folderName)
        );
        allFiles = allFiles.concat(nestedFiles);
      } 
      // 如果是文件，添加到结果数组
      else {
        allFiles.push({
          fileInfo: item,
          relativePath
        });
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error(`获取文件夹内容时出错: ${folderId}`, error);
    return [];
  }
}

interface DownloadRequest {
  fileIds: string[];
}

/**
 * 文件下载处理
 */
export const POST = withAuth<NextResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求体数据
    const { fileIds } = await req.json() as DownloadRequest;
    
    // 验证文件ID数组
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return createApiErrorResponse('文件ID列表无效', 400);
    }
    
    // 如果只下载一个文件
    if (fileIds.length === 1) {
      const fileId = fileIds[0];
      const fileInfo = await storageService.getFile(req.user.id, fileId);
      
      if (!fileInfo) {
        return createApiErrorResponse(`文件不存在: ${fileId}`, 404);
      }
      
      // 如果是文件夹，将文件夹内容打包为ZIP
      if (fileInfo.isFolder) {
        console.log(`文件夹下载请求: ID=${fileId}, 名称=${fileInfo.name}`);
        
        // 获取文件夹内所有文件
        const folderFiles = await getAllFilesInFolder(req.user.id, fileId);
        
        if (folderFiles.length === 0) {
          return createApiErrorResponse('文件夹为空，无法下载', 400);
        }
        
        // 创建ZIP文件
        const zip = new JSZip();
        const folderName = fileInfo.name || `folder_${fileId}`;
        
        console.log(`开始打包文件夹: ${folderName}，共 ${folderFiles.length} 个文件`);
        
        // 添加文件到ZIP
        for (const { fileInfo, relativePath } of folderFiles) {
          try {
            // 获取文件路径
            const filePath = await getFilePath(fileInfo);
            if (!filePath) {
              console.warn(`找不到文件: ${fileInfo.name}，跳过`);
              continue;
            }
            
            // 读取文件内容
            const fileContent = await fs.readFile(filePath);
            
            // 确定ZIP中的文件路径（包括相对路径）
            const fileName = fileInfo.name || `file_${fileInfo.id}`;
            const zipPath = join(relativePath, fileName);
            
            // 添加到ZIP
            zip.file(zipPath, fileContent);
            console.log(`已添加文件到ZIP: ${zipPath}`);
          } catch (error) {
            console.error(`添加文件到ZIP时出错: ${fileInfo.id}`, error);
          }
        }
        
        // 生成ZIP文件
        console.log('正在生成ZIP文件...');
        const zipContent = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 } 
        });
        
        console.log(`ZIP文件生成完成，大小: ${(zipContent.length / 1024).toFixed(2)} KB`);
        
        // 返回ZIP文件
        return new NextResponse(zipContent, {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(folderName)}.zip"`,
            'Content-Type': 'application/zip',
            'Content-Length': zipContent.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
      }
      
      // 如果是单个文件，走原来的下载逻辑
      console.log(`文件下载请求: ID=${fileId}, 名称=${fileInfo.name}, 类型=${fileInfo.type || '未知'}, 存储文件名=${fileInfo.filename || '未知'}`);
      
      // 获取文件路径
      const filePath = await getFilePath(fileInfo);
      
      // 如果找不到文件
      if (!filePath) {
        console.error(`文件不存在，尝试了多种方式查找: ID=${fileId}, 文件名=${fileInfo.name}, 存储文件名=${fileInfo.filename || '未知'}, URL=${fileInfo.url || '未知'}`);
        return createApiErrorResponse(`文件不存在或无法访问`, 404);
      }
      
      console.log(`准备下载文件: ${filePath}`);
      
      try {
        // 使用流式读取文件（处理大文件更高效）
        const fileContent = await fs.readFile(filePath);
        
        // 使用改进的内容类型检测
        const contentType = await determineContentType(fileInfo, filePath);
        
        console.log(`文件下载准备完成: ${fileInfo.name}, 大小: ${fileContent.length} 字节, 类型: ${contentType}`);
        
        // 获取安全的文件名，确保下载体验良好
        const safeFileName = fileInfo.name || fileInfo.filename || `文件_${fileId}`;
        
        // 设置下载头
        return new NextResponse(fileContent, {
          headers: {
            'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}"`,
            'Content-Type': contentType,
            'Content-Length': fileContent.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
      } catch (readError: any) {
        console.error(`读取文件失败: ${filePath}`, readError);
        return createApiErrorResponse('读取文件失败: ' + (readError.message || '未知错误'), 500);
      }
    } 
    
    // 如果下载多个文件，创建一个ZIP文件
    console.log(`批量下载请求: ${fileIds.length} 个文件`);
    
    // 创建ZIP文件
    const zip = new JSZip();
    
    // 添加文件到ZIP
    for (const fileId of fileIds) {
      try {
        const fileInfo = await storageService.getFile(req.user.id, fileId);
        
        if (!fileInfo) {
          console.warn(`文件不存在: ${fileId}，跳过`);
          continue;
        }
        
        // 如果是文件夹，递归获取文件夹内所有文件
        if (fileInfo.isFolder) {
          const folderName = fileInfo.name || `folder_${fileId}`;
          const folderFiles = await getAllFilesInFolder(req.user.id, fileId, folderName);
          
          for (const { fileInfo: nestedFile, relativePath } of folderFiles) {
            const filePath = await getFilePath(nestedFile);
            if (!filePath) {
              console.warn(`找不到文件: ${nestedFile.name}，跳过`);
              continue;
            }
            
            // 读取文件内容
            const fileContent = await fs.readFile(filePath);
            
            // 确定ZIP中的文件路径
            const fileName = nestedFile.name || `file_${nestedFile.id}`;
            const zipPath = join(relativePath, fileName);
            
            // 添加到ZIP
            zip.file(zipPath, fileContent);
            console.log(`已添加文件到ZIP: ${zipPath}`);
          }
        } 
        // 如果是单个文件，直接添加
        else {
          const filePath = await getFilePath(fileInfo);
          if (!filePath) {
            console.warn(`找不到文件: ${fileInfo.name}，跳过`);
            continue;
          }
          
          // 读取文件内容
          const fileContent = await fs.readFile(filePath);
          
          // 添加到ZIP，使用文件名
          const fileName = fileInfo.name || `file_${fileId}`;
          zip.file(fileName, fileContent);
          console.log(`已添加文件到ZIP: ${fileName}`);
        }
      } catch (error) {
        console.error(`处理文件时出错: ${fileId}`, error);
      }
    }
    
    // 生成ZIP文件
    console.log('正在生成ZIP文件...');
    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 } 
    });
    
    console.log(`ZIP文件生成完成，大小: ${(zipContent.length / 1024).toFixed(2)} KB`);
    
    // 返回ZIP文件
    return new NextResponse(zipContent, {
      headers: {
        'Content-Disposition': `attachment; filename="download_${new Date().getTime()}.zip"`,
        'Content-Type': 'application/zip',
        'Content-Length': zipContent.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  } catch (error: any) {
    console.error('下载文件失败:', error);
    return createApiErrorResponse(error.message || '下载文件失败', 500);
  }
}); 