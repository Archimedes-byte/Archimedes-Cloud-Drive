import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { getFile } from '@/app/lib/storage';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { ApiResponse } from '@/app/types';
import path from 'path';

// 路由配置
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// MIME类型映射
const MIME_TYPES: Record<string, string> = {
  // 图片
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'bmp': 'image/bmp',
  
  // 文档
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'rtf': 'application/rtf',
  'csv': 'text/csv',
  'md': 'text/markdown',
  'json': 'application/json',
  'xml': 'application/xml',
  
  // 音频
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
  'aac': 'audio/aac',
  
  // 视频
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  'mkv': 'video/x-matroska',
  'flv': 'video/x-flv',
  
  // 压缩文件
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip'
};

/**
 * 根据文件名和类型获取MIME类型
 * @param filename 文件名
 * @param fileType 文件类型
 * @returns MIME类型
 */
function getMimeType(filename: string, fileType?: string | null): string {
  // 默认MIME类型
  let mimeType = 'application/octet-stream';
  
  // 记录文件信息
  console.log('获取MIME类型:', { filename, fileType });
  
  // 尝试从文件扩展名获取MIME类型
  const ext = path.extname(filename).toLowerCase().substring(1); // 去掉点号
  console.log('文件扩展名:', ext);
  
  if (ext && MIME_TYPES[ext]) {
    mimeType = MIME_TYPES[ext];
    console.log(`从扩展名[${ext}]推断MIME类型: ${mimeType}`);
    return mimeType;
  }
  
  // 如果有文件类型，根据文件类型判断MIME
  if (fileType) {
    console.log('检查文件类型:', fileType);
    
    // 对已知的通用类型进行转换
    if (fileType === 'image') {
      mimeType = 'image/jpeg';
      console.log('识别为图片类型, 设置MIME为:', mimeType);
      return mimeType;
    }
    
    if (fileType === 'video') {
      mimeType = 'video/mp4';
      console.log('识别为视频类型, 设置MIME为:', mimeType);
      return mimeType;
    }
    
    if (fileType === 'audio') {
      mimeType = 'audio/mpeg';
      console.log('识别为音频类型, 设置MIME为:', mimeType);
      return mimeType;
    }
    
    if (fileType === 'document') {
      // 尝试通过扩展名判断具体的文档类型
      if (ext === 'pdf') {
        mimeType = 'application/pdf';
      } else if (['doc', 'docx'].includes(ext)) {
        mimeType = 'application/msword';
      } else if (['xls', 'xlsx'].includes(ext)) {
        mimeType = 'application/vnd.ms-excel';
      } else if (['ppt', 'pptx'].includes(ext)) {
        mimeType = 'application/vnd.ms-powerpoint';
      } else {
        mimeType = 'application/pdf'; // 默认文档类型
      }
      console.log('识别为文档类型, 设置MIME为:', mimeType);
      return mimeType;
    }
    
    // 如果文件类型包含MIME信息，直接使用
    if (fileType.includes('/')) {
      mimeType = fileType;
      console.log('使用文件记录的MIME类型:', mimeType);
      return mimeType;
    }

    // 如果文件类型是文件夹
    if (fileType === 'folder') {
      mimeType = 'application/vnd.folder';
      console.log('识别为文件夹, 设置MIME为:', mimeType);
      return mimeType;
    }
    
    // 压缩文件类型
    if (fileType === 'archive') {
      mimeType = 'application/zip';
      console.log('识别为压缩文件, 设置MIME为:', mimeType);
      return mimeType;
    }
  }
  
  // 最后一次尝试：根据常见扩展名判断
  if (ext) {
    // 图片扩展名
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      console.log('根据扩展名判断为图片文件:', mimeType);
      return mimeType;
    }
    
    // 文档扩展名
    if (['txt', 'html', 'css', 'js', 'json', 'xml', 'md'].includes(ext)) {
      const textTypes: Record<string, string> = {
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'md': 'text/markdown'
      };
      mimeType = textTypes[ext] || 'text/plain';
      console.log('根据扩展名判断为文本文件:', mimeType);
      return mimeType;
    }
    
    // 音频扩展名
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      const audioTypes: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac',
        'm4a': 'audio/mp4',
        'aac': 'audio/aac'
      };
      mimeType = audioTypes[ext] || 'audio/mpeg';
      console.log('根据扩展名判断为音频文件:', mimeType);
      return mimeType;
    }
    
    // 视频扩展名
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) {
      const videoTypes: Record<string, string> = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'flv': 'video/x-flv'
      };
      mimeType = videoTypes[ext] || 'video/mp4';
      console.log('根据扩展名判断为视频文件:', mimeType);
      return mimeType;
    }
  }
  
  console.log(`使用默认MIME类型: ${mimeType}，无法从扩展名[${ext}]或类型[${fileType}]推断`);
  return mimeType;
}

/**
 * 获取文件内容API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    console.log(`获取文件内容: ${fileId}`);

    // 从数据库获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      console.error(`文件不存在: ${fileId}`);
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    console.log(`文件信息:`, {
      id: file.id,
      name: file.name,
      type: file.type,
      path: file.path
    });

    // 构建文件路径
    const filePath = file.path;
    
    // 检查文件是否存在
    try {
      await stat(filePath);
    } catch (error) {
      console.error('文件不存在:', filePath, error);
      return NextResponse.json({ error: '文件不存在或已被删除' }, { status: 404 });
    }

    // 读取文件内容
    const fileContent = await readFile(filePath);
    
    // 确定MIME类型
    const contentType = getMimeType(file.name, file.type);
    console.log(`确定的内容类型: ${contentType}`);
    
    // 设置适当的响应头，确保文件能够被预览
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
      'Cache-Control': 'public, max-age=31536000',
      'Content-Length': fileContent.length.toString()
    };
    
    // 返回文件内容
    return new NextResponse(fileContent, { headers });
  } catch (error) {
    console.error('获取文件内容错误:', error);
    return NextResponse.json(
      { error: '获取文件内容失败' },
      { status: 500 }
    );
  }
} 