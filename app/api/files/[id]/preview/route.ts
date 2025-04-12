import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { getSignedUrl } from '@/app/lib/storage/getSignedUrl';
import { validateFileAccess } from '@/app/lib/file/validateFileAccess';
import { existsSync } from 'fs';

/**
 * 判断文件是否可预览的辅助函数
 */
function isPreviewableFile(type: string | null, extension: string): boolean {
  // 简化类型名判断
  if (type === 'image' || type === 'video' || type === 'audio' || type === 'document') {
    return true;
  }
  
  // MIME类型判断
  if (type?.startsWith('image/') || 
      type?.startsWith('video/') || 
      type?.startsWith('audio/') ||
      type?.startsWith('application/pdf') ||
      type?.includes('msword') ||
      type?.includes('officedocument') ||
      type?.includes('ms-excel') ||
      type?.includes('ms-powerpoint')) {
    return true;
  }
  
  // 基于扩展名判断
  const supportedImageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const supportedVideoExts = ['mp4', 'webm', 'ogv', 'mov', 'avi'];
  const supportedAudioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  const supportedDocumentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
  
  const supportedExtensions = [
    ...supportedImageExts,
    ...supportedVideoExts,
    ...supportedAudioExts,
    ...supportedDocumentExts
  ];
  
  return supportedExtensions.includes(extension.toLowerCase());
}

/**
 * 根据文件类型和扩展名获取标准MIME类型
 */
function getMimeType(type: string | null, extension: string): string {
  // 如果已经是标准MIME类型，直接返回
  if (type?.includes('/')) {
    return type;
  }
  
  // 简化类型映射到MIME类型
  if (type === 'image') {
    // 根据扩展名确定具体图片MIME类型
    const imageTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon'
    };
    return imageTypes[extension.toLowerCase()] || 'image/jpeg';
  }
  
  if (type === 'video') {
    // 根据扩展名确定具体视频MIME类型
    const videoTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogv': 'video/ogg',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo'
    };
    return videoTypes[extension.toLowerCase()] || 'video/mp4';
  }
  
  if (type === 'audio') {
    // 根据扩展名确定具体音频MIME类型
    const audioTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac'
    };
    return audioTypes[extension.toLowerCase()] || 'audio/mpeg';
  }
  
  if (type === 'document' || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(extension.toLowerCase())) {
    // 根据扩展名确定具体文档MIME类型
    const documentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv'
    };
    return documentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
  
  // 如果无法确定，返回通用MIME类型
  return 'application/octet-stream';
}

/**
 * GET /api/files/[id]/preview
 * 
 * 获取指定文件的预览 URL
 * 支持图片、视频、音频等文件类型的预览
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('接收预览请求，文件ID:', params.id);
  
  try {
    // 1. 获取会话信息验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('未授权访问，未找到有效会话');
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id as string;
    const fileId = params.id;

    if (!fileId) {
      return NextResponse.json({ success: false, error: '缺少文件ID' }, { status: 400 });
    }

    // 2. 从数据库获取文件信息
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        path: true,
        uploaderId: true,
        isFolder: true,
        parentId: true,
      },
    });

    if (!file) {
      console.log('文件不存在，ID:', fileId);
      return NextResponse.json({ success: false, error: '文件不存在' }, { status: 404 });
    }
    
    console.log('找到文件:', {
      id: file.id,
      name: file.name,
      type: file.type,
      path: file.path
    });

    // 3. 验证用户对文件的访问权限
    const hasAccess = await validateFileAccess(file, userId);
    if (!hasAccess) {
      console.log('用户无访问权限，用户ID:', userId);
      return NextResponse.json({ success: false, error: '没有权限访问此文件' }, { status: 403 });
    }

    // 4. 如果是文件夹，则不能预览
    if (file.isFolder) {
      return NextResponse.json({ success: false, error: '不能预览文件夹' }, { status: 400 });
    }

    // 检查文件是否实际存在
    if (!file.path || !existsSync(file.path)) {
      console.log('文件物理路径不存在:', file.path);
      return NextResponse.json({ 
        success: false, 
        error: '文件不存在或已被删除',
        debug: { path: file.path }
      }, { status: 404 });
    }

    // 5. 获取文件扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // 6. 判断文件是否可预览
    const isPreviewable = isPreviewableFile(file.type, extension);

    if (!isPreviewable) {
      console.log('文件类型不支持预览:', file.type, extension);
      return NextResponse.json({ 
        success: false, 
        error: '此文件类型不支持预览', 
        fileType: file.type 
      }, { status: 400 });
    }

    // 7. 获取正确的MIME类型
    const mimeType = getMimeType(file.type, extension);
    console.log('文件MIME类型:', mimeType);

    // 8. 生成签名 URL 用于预览
    // 对于图片，可以设置更短的过期时间；对于视频和音频，设置较长的过期时间
    const expiresIn = mimeType.startsWith('image/') ? 60 * 10 : 60 * 30; // 10分钟或30分钟
    const signedUrl = await getSignedUrl(file.path, expiresIn);
    
    console.log('成功生成预览URL，文件:', file.name);

    // 9. 返回预览 URL
    return NextResponse.json({
      success: true,
      url: signedUrl,
      fileType: mimeType,
      fileName: file.name
    });

  } catch (error) {
    console.error('获取文件预览 URL 失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取预览失败，请稍后重试',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 