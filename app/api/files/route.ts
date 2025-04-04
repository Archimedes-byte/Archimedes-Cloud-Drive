import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// 根据MIME类型和扩展名确定文件分类
function getFileCategory(mimeType: string, extension: string): string {
  // 图片类型
  if (mimeType.startsWith('image')) {
    return 'image';
  }
  
  // 视频类型
  if (mimeType.startsWith('video')) {
    return 'video';
  }
  
  // 音频类型
  if (mimeType.startsWith('audio')) {
    return 'audio';
  }
  
  // 文档类型
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    mimeType.startsWith('application/vnd.ms-excel') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
    mimeType.startsWith('application/vnd.ms-powerpoint') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml') ||
    mimeType.startsWith('text')
  ) {
    return 'document';
  }
  
  // 压缩文件类型
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip' ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension.toLowerCase())
  ) {
    return 'archive';
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
      console.log('正在根据类型过滤文件:', type);

      if (type === 'folder') {
        // 如果请求的是文件夹类型
        where.isFolder = true;
      } else {
        where.isFolder = false;
        
        if (type === 'image') {
          where.type = { startsWith: 'image' };
        } else if (type === 'video') {
          where.type = { startsWith: 'video' };
        } else if (type === 'audio') {
          // 音频类型 - 两种查询方式：
          // 1. 检查type字段是否直接等于"audio"（上传时设置的）
          // 2. 或者检查type字段是否以audio开头
          where.OR = [
            { type: "audio" }, // 直接匹配type=audio
            { type: { startsWith: 'audio/' } }
          ];
        } else if (type === 'document') {
          // 文档类型 - 两种查询方式：
          // 1. 检查type字段是否直接等于"document"（上传时设置的）
          // 2. 或者检查type字段是否以各种文档MIME类型开头
          where.OR = [
            { type: "document" }, // 直接匹配type=document
            { type: { startsWith: 'application/pdf' } },
            { type: { startsWith: 'application/msword' } },
            { type: { startsWith: 'application/vnd.openxmlformats-officedocument.wordprocessingml' } },
            { type: { startsWith: 'application/vnd.ms-excel' } },
            { type: { startsWith: 'application/vnd.openxmlformats-officedocument.spreadsheetml' } },
            { type: { startsWith: 'application/vnd.ms-powerpoint' } },
            { type: { startsWith: 'application/vnd.openxmlformats-officedocument.presentationml' } },
            { type: { startsWith: 'text' } }
          ];
        } else if (type === 'archive') {
          // 压缩文件类型
          where.OR = [
            { type: "archive" }, // 直接匹配type=archive
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
            }
          ];
        } else {
          // 其他类型
          where.OR = [
            {
              // 排除已知类型
              AND: [
                { type: { not: { startsWith: 'image' } } },
                { type: { not: { startsWith: 'video' } } },
                { type: { not: { startsWith: 'audio' } } },
                { type: { not: { startsWith: 'application/pdf' } } },
                { type: { not: { startsWith: 'application/msword' } } },
                { type: { not: { startsWith: 'application/vnd.openxmlformats-officedocument' } } },
                { type: { not: { startsWith: 'application/vnd.ms-' } } },
                { type: { not: { startsWith: 'text' } } },
                { type: { not: 'document' } }
              ]
            }
          ];
        }
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

        // 创建包含所有原始属性的新对象，并添加显示路径属性
        const itemWithPath = {
          ...item,
          displayPath: fullPath ? `${fullPath}/${item.name}` : item.name
        };

        return itemWithPath as typeof item & { displayPath: string };
      });

      // 按路径排序
      processedItems.sort((a: any, b: any) => (a.displayPath || '').localeCompare(b.displayPath || ''));
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
      success: true,
      message: '获取文件列表成功',
      data: processedItems
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json({ 
      success: false,
      message: '获取文件列表失败',
      error: '获取文件列表失败'
    }, { status: 500 });
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
    const isFolderUpload = formData.get('isFolderUpload') === 'true';
    const relativePath = formData.get('relativePath') as string || '';
    
    console.log('文件上传信息:', {
      文件名: file?.name,
      父文件夹ID: parentId,
      是否文件夹上传: isFolderUpload,
      相对路径: relativePath,
    });

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 检查存储空间
    if (user.storageUsed + file.size > user.storageLimit) {
      return NextResponse.json({ error: '存储空间不足' }, { status: 400 });
    }

    // 创建文件夹结构(如果是文件夹上传模式)
    let actualParentId = parentId || null;
    
    if (isFolderUpload && relativePath) {
      // 从相对路径解析文件夹结构
      const pathParts = relativePath.split('/').filter(part => part);
      
      // 如果有路径，需要创建文件夹结构
      if (pathParts.length > 0) {
        let currentParentId = parentId || null;
        
        // 遍历路径，逐级创建文件夹（如果不存在）
        for (let i = 0; i < pathParts.length; i++) {
          const folderName = pathParts[i];
          
          // 检查文件夹是否已存在
          const existingFolder = await prisma.file.findFirst({
            where: {
              name: folderName,
              parentId: currentParentId,
              uploaderId: user.id,
              isFolder: true,
              isDeleted: false
            }
          });
          
          if (existingFolder) {
            currentParentId = existingFolder.id;
          } else {
            // 创建新文件夹
            console.log(`创建文件夹: ${folderName}, 父ID: ${currentParentId}`);
            const newFolder = await prisma.file.create({
              data: {
                id: uuidv4(),
                name: folderName,
                filename: folderName,
                path: relativePath.substring(0, relativePath.indexOf(folderName) + folderName.length),
                parentId: currentParentId,
                uploaderId: user.id,
                isFolder: true,
                type: 'folder',
                size: 0,
                url: '',
                updatedAt: new Date()
              }
            });
            
            currentParentId = newFolder.id;
          }
        }
        
        // 更新实际父文件夹ID
        actualParentId = currentParentId;
      }
    }

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名并保留原始文件名
    const originalFilename = file.name;
    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, uniqueFilename);
    
    // 写入文件
    await writeFile(filePath, buffer);

    // 提取文件扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // 获取文件类型分类
    const fileCategory = getFileCategory(file.type, extension);
    
    // 创建标签数组
    const tags = [fileCategory];
    if (extension) {
      tags.push(extension);
    }

    // 创建文件记录 - 重要：保留原始文件名作为name字段
    const fileDoc = await prisma.file.create({
      data: {
        id: uuidv4(),
        name: originalFilename, // 使用原始文件名供显示
        filename: uniqueFilename, // 存储唯一文件名用于文件系统
        path: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
        type: file.type,
        size: buffer.length,
        parentId: actualParentId,
        uploaderId: user.id,
        isFolder: false,
        tags: tags,
        url: `/uploads/${uniqueFilename}`,
        updatedAt: new Date()
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

    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      data: fileDoc,
      isFolderUpload,
      relativePath
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json({ 
      success: false,
      message: '文件上传失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 