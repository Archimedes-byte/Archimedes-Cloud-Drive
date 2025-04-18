import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/lib/prisma';
import { getFileStream } from '@/app/lib/storage/file-handler';
import { Readable } from 'stream';
import path from 'path';

/**
 * 将Node.js的Readable流转换为Web标准的ReadableStream
 */
function streamToReadableStream(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    }
  });
}

/**
 * 下载分享文件
 * POST /api/storage/share/download
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    const { shareCode, extractCode, fileId } = data;

    // 验证参数
    if (!shareCode || !extractCode || !fileId) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
    }

    // 查询分享记录 - 获取所有分享的文件和文件夹，而不仅仅是请求的文件
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

    // 检查文件是否在直接分享列表中
    const directSharedFile = share.files.find(f => f.fileId === fileId);
    
    if (!directSharedFile) {
      // 文件不在直接分享列表中，检查是否在分享的文件夹内
      const isAccessible = await isFileInSharedFolder(share, fileId);
      if (!isAccessible) {
        return NextResponse.json(
          { success: false, error: '请求的文件不在分享列表中' },
          { status: 404 }
        );
      }
      
      // 获取文件信息
      const file = await db.file.findUnique({
        where: { id: fileId }
      });
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: '文件不存在' },
          { status: 404 }
        );
      }
      
      // 检查是否是文件夹
      if (file.isFolder) {
        return NextResponse.json(
          { success: false, error: '无法直接下载文件夹' },
          { status: 400 }
        );
      }
      
      // 获取文件流
      const fileStream = await getFileStream(file.filename);
      
      if (!fileStream) {
        return NextResponse.json(
          { success: false, error: '文件不存在或已损坏' },
          { status: 404 }
        );
      }
      
      // 设置Content-Disposition头以触发下载
      const filename = encodeURIComponent(file.name);
      const headers = {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': file.type || 'application/octet-stream',
      };
      
      // 将Node.js的Readable流转换为Web标准的ReadableStream
      const webStream = streamToReadableStream(fileStream);
      
      // 返回文件流
      return new Response(webStream, { headers });
    } else {
      // 文件在直接分享列表中
      const file = directSharedFile.file;

      // 检查是否是文件夹（不能直接下载）
      if (file.isFolder) {
        return NextResponse.json(
          { success: false, error: '无法直接下载文件夹' },
          { status: 400 }
        );
      }

      // 获取文件流
      const fileStream = await getFileStream(file.filename);
      
      if (!fileStream) {
        return NextResponse.json(
          { success: false, error: '文件不存在或已损坏' },
          { status: 404 }
        );
      }

      // 设置Content-Disposition头以触发下载
      const filename = encodeURIComponent(file.name);
      const headers = {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': file.type || 'application/octet-stream',
      };
      
      // 将Node.js的Readable流转换为Web标准的ReadableStream
      const webStream = streamToReadableStream(fileStream);
      
      // 返回文件流
      return new Response(webStream, { headers });
    }
  } catch (error) {
    console.error('下载分享文件失败:', error);
    return NextResponse.json(
      { success: false, error: '下载失败，请重试' },
      { status: 500 }
    );
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
  
  if (!file || file.isFolder) return false;
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