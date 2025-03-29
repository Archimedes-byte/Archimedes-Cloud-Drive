import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// 文件类型判断函数
function getFileCategory(mimeType: string, extension: string): string {
  // 图片类型
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  
  // 视频类型
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  
  // 音频类型
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  // 文档类型
  const documentMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  
  const documentExtensions = ['doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  
  if (documentMimeTypes.includes(mimeType) || documentExtensions.includes(extension.toLowerCase())) {
    return 'document';
  }
  
  // 压缩文件和其他类型
  const archiveMimeTypes = [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-compressed',
    'application/x-tar',
    'application/gzip'
  ];
  
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  
  if (archiveMimeTypes.includes(mimeType) || archiveExtensions.includes(extension.toLowerCase())) {
    return 'other';
  }
  
  // 默认为其他类型
  return 'other';
}

// 获取文件列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const type = searchParams.get('type');

    console.log('获取文件列表参数:', { folderId, type });

    // 基础查询条件
    const where: any = {
      uploaderId: user.id,
      isDeleted: false,
    };

    // 如果指定了类型，进行类型筛选
    if (type) {
      where.isFolder = false;
      
      if (type === 'image/') {
        where.type = { startsWith: 'image/' };
      } else if (type === 'video/') {
        where.type = { startsWith: 'video/' };
      } else if (type === 'audio/') {
        where.type = { startsWith: 'audio/' };
      } else if (type === 'application/') {
        // 文档类型
        where.OR = [
          { type: { startsWith: 'application/pdf' } },
          { type: { startsWith: 'application/msword' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.wordprocessingml' } },
          { type: { startsWith: 'application/vnd.ms-excel' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.spreadsheetml' } },
          { type: { startsWith: 'application/vnd.ms-powerpoint' } },
          { type: { startsWith: 'application/vnd.openxmlformats-officedocument.presentationml' } },
          { type: { startsWith: 'text/plain' } }
        ];
      } else if (type === 'other') {
        // 其他类型（包括压缩文件）
        where.OR = [
          {
            // 压缩文件类型
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
          },
          {
            // 排除已知类型
            AND: [
              { type: { not: { startsWith: 'image/' } } },
              { type: { not: { startsWith: 'video/' } } },
              { type: { not: { startsWith: 'audio/' } } },
              { type: { not: { startsWith: 'application/pdf' } } },
              { type: { not: { startsWith: 'application/msword' } } },
              { type: { not: { startsWith: 'application/vnd.openxmlformats-officedocument' } } },
              { type: { not: { startsWith: 'application/vnd.ms-' } } },
              { type: { not: { startsWith: 'text/plain' } } }
            ]
          }
        ];
      }
    } else {
      // 如果没有指定类型，则显示当前文件夹下的内容
      where.parentId = folderId || null;
    }

    console.log('构建的查询条件:', JSON.stringify(where, null, 2));

    // 获取文件和文件夹列表
    const items = await prisma.file.findMany({
      where,
      orderBy: [
        { isFolder: 'desc' },  // 文件夹优先显示
        { createdAt: 'desc' }  // 按创建时间倒序
      ]
    });

    // 如果是在进行类型筛选，获取文件的完整路径信息
    let processedItems = items;
    if (type) {
      // 获取所有文件夹信息用于构建路径
      const allFolders = await prisma.file.findMany({
        where: {
          uploaderId: user.id,
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
      processedItems = items.map(item => {
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

        return {
          ...item,
          fullPath: fullPath ? `${fullPath}/${item.name}` : item.name
        };
      });

      // 按路径排序
      processedItems.sort((a, b) => (a.fullPath || '').localeCompare(b.fullPath || ''));
    }

    // 获取当前文件夹信息（如果有）
    let currentFolder = null;
    if (folderId) {
      currentFolder = await prisma.file.findFirst({
        where: {
          id: folderId,
          uploaderId: user.id,
          isFolder: true,
          isDeleted: false
        }
      });

      if (!currentFolder) {
        return NextResponse.json({ error: '文件夹不存在' }, { status: 404 });
      }
    }

    console.log('查询结果:', {
      currentFolder,
      itemCount: processedItems.length,
      folders: processedItems.filter(item => item.isFolder).length,
      files: processedItems.filter(item => !item.isFolder).length
    });

    return NextResponse.json({
      currentFolder,
      items: processedItems
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json({ error: '获取文件列表失败' }, { status: 500 });
  }
}

// 上传文件
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parentId = formData.get('parentId') as string;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 检查存储空间
    if (user.storageUsed + file.size > user.storageLimit) {
      return NextResponse.json({ error: '存储空间不足' }, { status: 400 });
    }

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名
    const uniqueFilename = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, uniqueFilename);
    
    // 写入文件
    await writeFile(filePath, buffer);

    // 创建文件记录
    const fileDoc = await prisma.file.create({
      data: {
        name: file.name,
        filename: file.name,
        path: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
        type: file.type,
        size: buffer.length,
        data: buffer,
        parentId: parentId || null,
        uploaderId: user.id,
        isFolder: false,
        tags: [file.type]
      }
    });

    // 更新用户存储空间使用量
    await prisma.user.update({
      where: { id: user.id },
      data: {
        storageUsed: {
          increment: file.size
        }
      }
    });

    return NextResponse.json(fileDoc);
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
  }
} 