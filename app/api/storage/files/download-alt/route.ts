/**
 * 文件下载备用API路由
 * 提供简化的下载机制，用于处理主下载接口失败的情况
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, createApiErrorResponse } from '@/app/middleware/auth';
import { StorageService } from '@/app/services/storage-service';
import JSZip from 'jszip';
import fs from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import path from 'path';
import { FileInfo } from '@/app/types';
import mime from 'mime-types';

const storageService = new StorageService();
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  fs.mkdir(UPLOAD_DIR, { recursive: true }).catch((err: Error) => {
    console.error('创建上传目录失败:', err);
  });
}

/**
 * 获取文件的存储路径 - 增强版
 * @param fileInfo 文件信息
 * @returns 文件的存储路径或null（如果找不到）
 */
async function getFilePath(fileInfo: FileInfo): Promise<string | null> {
  if (!fileInfo) return null;
  
  // 存储所有可能的路径
  const possiblePaths: string[] = [];
  
  // 1. 尝试使用filename字段（最可靠）
  if (fileInfo.filename) {
    possiblePaths.push(join(UPLOAD_DIR, fileInfo.filename));
  }
  
  // 2. 尝试使用ID作为文件名
  possiblePaths.push(join(UPLOAD_DIR, fileInfo.id));
  
  // 3. 尝试从URL解析
  if (fileInfo.url) {
    const urlParts = fileInfo.url.split('/');
    const filenameFromUrl = urlParts[urlParts.length - 1];
    if (filenameFromUrl) {
      possiblePaths.push(join(UPLOAD_DIR, filenameFromUrl));
    }
  }
  
  // 4. 尝试使用路径和名称组合
  if (fileInfo.path) {
    try {
      // 去除开头的"/"
      const cleanPath = fileInfo.path.replace(/^\//, '');
      const filenameWithPath = join(cleanPath, fileInfo.name);
      possiblePaths.push(join(UPLOAD_DIR, filenameWithPath));
    } catch (error) {
      console.error('处理文件路径时出错:', error);
    }
  }
  
  // 检查所有可能的路径
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`备用方法找到文件: ${path}`);
      return path;
    }
  }
  
  console.error(`备用下载API无法找到文件: ${fileInfo.id}, 名称=${fileInfo.name}`);
  return null;
}

/**
 * 确定文件的MIME类型
 * @param fileInfo 文件信息
 * @returns 文件的MIME类型
 */
function determineContentType(fileInfo: FileInfo): string {
  // 默认内容类型
  let contentType = 'application/octet-stream';
  
  try {
    // 1. 尝试使用数据库中存储的文件类型
    if (fileInfo.type && fileInfo.type !== 'folder' && fileInfo.type !== 'unknown') {
      if (typeof fileInfo.type === 'string' && fileInfo.type.includes('/')) {
        contentType = fileInfo.type;
        return contentType;
      }
    }
    
    // 2. 尝试使用mime-types包根据扩展名确定
    if (fileInfo.name) {
      const mimeType = mime.lookup(fileInfo.name);
      if (mimeType) {
        contentType = mimeType;
        return contentType;
      }
    }
    
    // 3. 简单的类型映射（备用）
    const ext = path.extname(fileInfo.name).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (['.png'].includes(ext)) {
      contentType = 'image/png';
    } else if (['.gif'].includes(ext)) {
      contentType = 'image/gif';
    } else if (['.webp'].includes(ext)) {
      contentType = 'image/webp';
    } else if (['.pdf'].includes(ext)) {
      contentType = 'application/pdf';
    } else if (['.txt', '.md'].includes(ext)) {
      contentType = 'text/plain';
    } else if (['.html', '.htm'].includes(ext)) {
      contentType = 'text/html';
    } else if (['.css'].includes(ext)) {
      contentType = 'text/css';
    } else if (['.js'].includes(ext)) {
      contentType = 'application/javascript';
    } else if (['.json'].includes(ext)) {
      contentType = 'application/json';
    } else if (['.xml'].includes(ext)) {
      contentType = 'application/xml';
    } else if (['.zip'].includes(ext)) {
      contentType = 'application/zip';
    } else if (['.doc', '.docx'].includes(ext)) {
      contentType = 'application/msword';
    } else if (['.xls', '.xlsx'].includes(ext)) {
      contentType = 'application/vnd.ms-excel';
    } else if (['.ppt', '.pptx'].includes(ext)) {
      contentType = 'application/vnd.ms-powerpoint';
    }
    
    return contentType;
  } catch (error) {
    console.error('确定内容类型时出错:', error);
    return 'application/octet-stream';
  }
}

/**
 * 备用下载API处理
 */
export const GET = withAuth<NextResponse>(async (req: AuthenticatedRequest) => {
  try {
    // 获取请求参数
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');
    
    if (!fileId) {
      return createApiErrorResponse('文件ID不能为空', 400);
    }
    
    console.log(`备用下载请求处理: ${fileId}`);
    
    // 获取文件信息
    const fileInfo = await storageService.getFile(req.user.id, fileId);
    if (!fileInfo) {
      return createApiErrorResponse(`文件不存在: ${fileId}`, 404);
    }
    
    // 如果是文件夹，处理文件夹下载
    if (fileInfo.isFolder) {
      console.log(`备用文件夹下载: ${fileInfo.name}`);
      
      try {
        // 获取文件夹下的文件，使用已有的getFiles方法
        const folderContent = await storageService.getFiles(req.user.id, fileId);
        const folderFiles = folderContent.items || [];
        
        // 创建ZIP文件
        const zip = new JSZip();
        const folderName = fileInfo.name || `folder_${fileId}`;
        
        // 如果文件夹为空，添加空文件夹标记
        if (!folderFiles || folderFiles.length === 0) {
          console.log(`备用API: 文件夹为空，添加空标记`);
          zip.file(`${folderName}/.empty`, '此文件夹为空', { comment: '空文件夹标记' });
        } else {
          console.log(`备用API: 文件夹包含 ${folderFiles.length} 个项目`);
          
          // 添加文件到ZIP
          for (const file of folderFiles) {
            // 只处理文件，不处理子文件夹（简化版）
            if (!file.isFolder) {
              try {
                const filePath = await getFilePath(file);
                if (filePath) {
                  const fileContent = await fs.readFile(filePath);
                  zip.file(join(folderName, file.name), fileContent);
                  console.log(`已添加文件到ZIP: ${file.name}`);
                } else {
                  console.warn(`找不到文件: ${file.name} (${file.id})`);
                }
              } catch (error) {
                console.error(`添加文件到ZIP失败: ${file.name}`, error);
              }
            } else {
              // 至少创建空文件夹结构
              console.log(`为子文件夹创建结构: ${file.name}`);
              zip.folder(join(folderName, file.name));
            }
          }
        }
        
        // 生成ZIP
        console.log('正在生成ZIP文件...');
        const zipContent = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 4 } // 降低压缩级别，提高速度
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
          }
        });
      } catch (folderError) {
        console.error('处理文件夹下载失败:', folderError);
        return createApiErrorResponse('处理文件夹下载失败', 500);
      }
    } 
    
    // 如果是单个文件，直接下载
    try {
      console.log(`备用API: 单文件下载 ${fileInfo.name}`);
      const filePath = await getFilePath(fileInfo);
      
      if (!filePath) {
        return createApiErrorResponse(`找不到文件: ${fileInfo.name}`, 404);
      }
      
      const fileContent = await fs.readFile(filePath);
      console.log(`文件读取成功，大小: ${(fileContent.length / 1024).toFixed(2)} KB`);
      
      // 确定内容类型
      const contentType = determineContentType(fileInfo);
      
      // 构建安全的文件名
      let safeFileName = fileInfo.name;
      if (!safeFileName) {
        safeFileName = `文件_${fileInfo.id}`;
        // 尝试添加适当的扩展名
        if (contentType && contentType !== 'application/octet-stream') {
          const ext = mime.extension(contentType);
          if (ext) {
            safeFileName += `.${ext}`;
          }
        }
      }
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}"`,
          'Content-Type': contentType,
          'Content-Length': fileContent.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (fileError) {
      console.error('处理单文件下载失败:', fileError);
      return createApiErrorResponse('处理文件下载失败', 500);
    }
  } catch (error: any) {
    console.error('备用下载处理出错:', error);
    return createApiErrorResponse(`下载处理出错: ${error.message || '未知错误'}`, 500);
  }
}); 