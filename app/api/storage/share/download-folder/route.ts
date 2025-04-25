import { NextRequest, NextResponse } from 'next/server';
import { getFileStream } from '@/app/lib/storage/file-handling/file-handler';
import { db } from '@/app/lib/database';
import { Readable } from 'stream';
import JSZip from 'jszip';

interface FileInfo {
  id: string;
  name: string;
  path: string;
  filename: string;
  isFolder: boolean;
}

/**
 * 打包下载分享文件夹
 * POST /api/storage/share/download-folder
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    const { shareCode, extractCode, folderId } = data;

    // 验证参数
    if (!shareCode || !extractCode || !folderId) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
    }

    // 查询分享记录，获取所有分享的文件和文件夹
    const share = await db.fileShare.findFirst({
      where: {
        shareCode,
        extractCode,
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 分享不存在或提取码错误
    if (!share) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在或提取码错误' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: '分享链接已过期' },
        { status: 403 }
      );
    }

    // 验证文件夹是否在分享内
    const directSharedFolder = share.files.find(f => f.fileId === folderId && f.file.isFolder);
    let isAccessible = !!directSharedFolder;
    
    // 如果不是直接分享的文件夹，检查是否是子文件夹
    if (!isAccessible) {
      isAccessible = await isFileInSharedFolder(share, folderId);
      if (!isAccessible) {
        return NextResponse.json(
          { success: false, error: '请求的文件夹不在分享列表中' },
          { status: 404 }
        );
      }
    }

    // 获取文件夹信息
    const folder = await db.file.findUnique({
      where: { id: folderId },
      select: { id: true, name: true, isFolder: true }
    });

    if (!folder || !folder.isFolder) {
      return NextResponse.json(
        { success: false, error: '请求的对象不是文件夹' },
        { status: 400 }
      );
    }

    // 收集文件夹中所有文件
    const folderName = folder.name;
    const allFiles: FileInfo[] = [];

    await collectFilesRecursively(folderId, '', allFiles);

    if (allFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: '文件夹为空，无法打包下载' },
        { status: 400 }
      );
    }

    // 创建ZIP对象
    const zip = new JSZip();
    
    // 添加每个文件到ZIP
    for (const file of allFiles) {
      if (!file.isFolder) {
        const fileStream = await getFileStream(file.filename);
        if (fileStream) {
          // 读取整个文件内容
          const chunks: Buffer[] = [];
          for await (const chunk of fileStream) {
            chunks.push(chunk);
          }
          const fileContent = Buffer.concat(chunks);
          
          // 添加到ZIP中
          zip.file(file.path, fileContent);
        }
      }
    }

    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 5 // 压缩级别 1-9，越高压缩率越好但越慢
      }
    });

    // 设置响应头
    const headers = {
      'Content-Disposition': `attachment; filename="${encodeURIComponent(folderName)}.zip"; filename*=UTF-8''${encodeURIComponent(folderName)}.zip`,
      'Content-Type': 'application/zip',
      'Cache-Control': 'no-cache',
    };

    // 返回ZIP文件
    return new Response(zipBuffer, { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('下载分享文件夹失败:', error);
    return NextResponse.json(
      { success: false, error: '下载失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * 递归收集文件夹中的所有文件
 */
async function collectFilesRecursively(
  folderId: string, 
  currentPath: string, 
  results: FileInfo[]
): Promise<void> {
  // 获取当前文件夹信息
  const folder = await db.file.findUnique({
    where: { id: folderId },
    select: { name: true }
  });

  if (!folder) return;

  // 构建当前路径
  const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
  
  // 获取文件夹内容
  const contents = await db.file.findMany({
    where: {
      parentId: folderId,
      isDeleted: false
    }
  });

  // 遍历文件夹内容
  for (const item of contents) {
    const itemPath = `${folderPath}/${item.name}`;
    
    if (item.isFolder) {
      // 如果是文件夹，递归调用
      results.push({
        id: item.id,
        name: item.name,
        path: itemPath,
        filename: '', // 文件夹没有filename
        isFolder: true
      });
      
      await collectFilesRecursively(item.id, folderPath, results);
    } else {
      // 如果是文件，加入结果
      results.push({
        id: item.id,
        name: item.name,
        path: itemPath,
        filename: item.filename,
        isFolder: false
      });
    }
  }
}

/**
 * 检查文件是否在分享的文件夹内
 */
async function isFileInSharedFolder(share: any, fileId: string): Promise<boolean> {
  // 首先获取当前文件信息
  const file = await db.file.findUnique({
    where: { id: fileId },
    select: { parentId: true, isFolder: true }
  });
  
  if (!file) return false;
  if (!file.parentId) return false;
  
  // 获取分享中的所有文件夹
  const sharedFolders = share.files
    .filter((f: any) => f.file.isFolder)
    .map((f: any) => f.file.id);
  
  // 检查文件的父文件夹是否在分享列表中
  if (sharedFolders.includes(file.parentId)) return true;
  
  // 递归检查上级文件夹
  return isParentFolderShared(sharedFolders, file.parentId);
}

/**
 * 递归检查父文件夹是否在分享列表中
 */
async function isParentFolderShared(sharedFolders: string[], folderId: string): Promise<boolean> {
  const folder = await db.file.findUnique({
    where: { id: folderId },
    select: { parentId: true }
  });
  
  if (!folder || !folder.parentId) return false;
  
  // 如果当前文件夹的父文件夹在分享列表中，返回true
  if (sharedFolders.includes(folder.parentId)) return true;
  
  // 否则继续递归检查
  return isParentFolderShared(sharedFolders, folder.parentId);
} 