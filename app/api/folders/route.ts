import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ApiResponse, 
  FileInfo, 
  FileEntity, 
  mapFileEntityToFileInfo, 
  CreateFolderRequest 
} from '@/app/types';

export async function POST(request: Request): Promise<NextResponse<ApiResponse<FileInfo>>> {
  try {
    // 验证用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false,
          error: '请先登录' 
        },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: '用户不存在' 
        },
        { status: 401 }
      );
    }

    // 获取请求体数据
    const { name, parentId, tags = [] } = await request.json() as CreateFolderRequest;

    if (!name?.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: '文件夹名称不能为空' 
        },
        { status: 400 }
      );
    }
    
    // 处理标签 - 去除重复标签
    const uniqueTags = Array.isArray(tags) 
      ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
      : [];

    // 检查相同目录下是否已存在同名文件夹
    const existingFolder = await prisma.file.findFirst({
      where: {
        name: name.trim(),
        parentId: parentId || null,
        uploaderId: user.id,
        isFolder: true,
        isDeleted: false,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { 
          success: false,
          error: `文件夹 "${name}" 已存在于当前目录` 
        },
        { status: 409 }  // 409 Conflict
      );
    }

    // 如果有父文件夹，验证其存在性和所有权
    let parentFolder = null;
    if (parentId) {
      parentFolder = await prisma.file.findFirst({
        where: {
          id: parentId,
          uploaderId: user.id,
          isFolder: true,
          isDeleted: false,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { 
            success: false,
            error: '父文件夹不存在或无权限访问' 
          },
          { status: 404 }
        );
      }
    }

    // 生成文件夹路径
    let folderPath;
    if (parentFolder) {
      // 如果有父文件夹，将新文件夹路径添加到父文件夹路径后
      const parentPath = parentFolder.path.startsWith('/') 
        ? parentFolder.path.substring(1) 
        : parentFolder.path;
      folderPath = join(parentPath, name).replace(/\\/g, '/');
    } else {
      // 如果是根目录，直接使用文件夹名
      folderPath = name;
    }

    // 确保路径以/开头
    if (!folderPath.startsWith('/')) {
      folderPath = '/' + folderPath;
    }

    // 创建文件夹
    const folder = await prisma.file.create({
      data: {
        id: uuidv4(),
        name,
        filename: name,
        type: 'folder',
        size: 0,
        isFolder: true,
        uploaderId: user.id,
        parentId: parentId || null,
        path: folderPath,
        tags: uniqueTags,  // 使用去重后的标签
        url: null,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ 
      success: true,
      data: mapFileEntityToFileInfo(folder)
    });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '创建文件夹失败' 
      },
      { status: 500 }
    );
  }
} 