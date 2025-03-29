import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 记录请求信息
    const requestHeaders: { [key: string]: string } = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    console.log('收到文件内容请求:', {
      fileId: params.id,
      method: request.method,
      url: request.url,
      headers: requestHeaders
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 查询文件信息
    const file = await prisma.file.findFirst({
      where: {
        id: params.id,
        uploaderId: session.user.id,
        isDeleted: false
      }
    });

    if (!file) {
      console.error('文件记录不存在:', params.id);
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    const fileType = file.type || 'application/octet-stream';
    
    console.log('找到文件记录:', {
      id: file.id,
      name: file.name,
      type: fileType,
      size: file.size,
      path: file.path,
      isAudio: fileType.startsWith('audio/')
    });

    // 构建文件的完整路径
    const basePath = process.cwd();
    const filePath = join(basePath, file.path);

    // 获取文件状态
    const fileStats = await stat(filePath).catch(err => {
      console.error('获取文件状态失败:', err);
      return null;
    });

    console.log('文件路径信息:', {
      basePath,
      storedPath: file.path,
      resolvedPath: filePath,
      exists: existsSync(filePath),
      stats: fileStats ? {
        size: fileStats.size,
        mode: fileStats.mode,
        uid: fileStats.uid,
        gid: fileStats.gid,
        accessTime: fileStats.atime,
        modifyTime: fileStats.mtime,
        changeTime: fileStats.ctime
      } : null
    });

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      console.error('文件不存在于磁盘:', filePath);
      return NextResponse.json({ error: '文件不存在于磁盘' }, { status: 404 });
    }

    // 读取文件内容
    console.log('开始读取文件内容');
    const fileContent = await readFile(filePath);
    console.log('文件内容读取完成:', {
      contentLength: fileContent.length,
      expectedSize: file.size,
      contentType: fileType,
      firstBytes: fileContent.slice(0, 4).toString('hex'),
      isAudioHeader: fileType.startsWith('audio/') ? 
        fileContent.slice(0, 4).toString('hex') === '494433' || // ID3v2
        fileContent.slice(0, 2).toString('hex') === 'fffa' || // MP3
        fileContent.slice(0, 4).toString('hex') === '4f676753' // OGG
        : null
    });

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', fileType);
    headers.set('Content-Length', fileContent.length.toString());
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Accept-Ranges', 'bytes');

    // 对于音频文件，添加额外的响应头
    if (fileType.startsWith('audio/')) {
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    }

    // 处理范围请求
    const range = request.headers.get('range');
    if (range) {
      console.log('处理范围请求:', { range });
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileContent.length - 1;
      const chunkSize = end - start + 1;

      if (start >= 0 && end < fileContent.length) {
        headers.set('Content-Range', `bytes ${start}-${end}/${fileContent.length}`);
        headers.set('Content-Length', chunkSize.toString());
        
        console.log('返回部分内容:', {
          start,
          end,
          chunkSize,
          totalSize: fileContent.length,
          chunkFirstBytes: fileContent.slice(start, Math.min(start + 4, end + 1)).toString('hex')
        });

        return new NextResponse(fileContent.slice(start, end + 1), {
          status: 206,
          headers
        });
      }
    }

    console.log('返回完整文件:', {
      size: fileContent.length,
      type: fileType,
      firstBytes: fileContent.slice(0, 4).toString('hex')
    });

    // 返回完整文件
    return new NextResponse(fileContent, {
      headers
    });

  } catch (error) {
    console.error('获取文件内容失败:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error)
    });
    
    return NextResponse.json(
      { 
        error: '获取文件内容失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 