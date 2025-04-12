import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { ApiResponse, FileInfo, mapFileEntityToFileInfo } from '@/app/types';
import { generateFileUrl } from '@/app/lib/storage';
import path from 'path';
import fs from 'fs/promises';

// 扩展RenameFileRequest接口以包含标签
interface RenameFileRequest {
  id: string;
  newName: string;
  tags?: string[];
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<FileInfo | null>>> {
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

    const body = await request.json() as RenameFileRequest;
    const { id: fileId, newName, tags } = body;

    if (!newName || newName.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: '文件名不能为空' 
        },
        { status: 400 }
      );
    }

    // 处理标签 - 去除重复标签
    const uniqueTags = Array.isArray(tags) 
      ? [...new Set(tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''))]
      : undefined;

    // 获取文件信息
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        uploaderId: user.id,
      },
    });

    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: '文件不存在' 
        },
        { status: 404 }
      );
    }

    // 检查同一目录下是否已存在同名文件/文件夹
    const existingFile = await prisma.file.findFirst({
      where: {
        name: newName.trim(),
        parentId: file.parentId,
        uploaderId: user.id,
        isFolder: file.isFolder, // 同类型检查（文件夹只检查同名文件夹，文件只检查同名文件）
        id: { not: fileId }, // 排除当前文件/文件夹自身
        isDeleted: false,
      },
    });

    if (existingFile) {
      return NextResponse.json(
        { 
          success: false,
          error: `同一目录下已存在同名${file.isFolder ? '文件夹' : '文件'}` 
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 判断是否是文件夹
    if (file.isFolder) {
      // 更新文件夹名称和标签
      const updatedFolder = await prisma.file.update({
        where: { id: fileId },
        data: {
          name: newName.trim(),
          tags: uniqueTags || file.tags, // 使用去重后的标签
        },
      });

      return NextResponse.json({
        success: true,
        message: '重命名成功',
        data: mapFileEntityToFileInfo(updatedFolder)
      });
    }

    // 获取文件扩展名
    const oldExtension = file.name.includes('.') ? file.name.split('.').pop() : '';
    const fileNameWithoutExt = file.name.includes('.') 
      ? file.name.substring(0, file.name.lastIndexOf('.'))
      : file.name;
    
    const newNameWithoutExt = newName.includes('.')
      ? newName.substring(0, newName.lastIndexOf('.'))
      : newName;
      
    const newExtension = newName.includes('.') ? newName.split('.').pop() : oldExtension;
    
    // 构建新的文件名，保持原始文件唯一标识
    // 格式：新文件名 + 原始文件名中的唯一标识部分
    const oldFilename = file.filename || '';
    const uniquePart = oldFilename.includes('_') ? oldFilename.split('_')[0] : '';
    const newFilename = uniquePart 
      ? `${uniquePart}_${newNameWithoutExt}.${newExtension}`
      : `${newNameWithoutExt}.${newExtension}`;
      
    // 构建新的文件路径
    const directoryPath = path.dirname(file.path);
    const newPath = path.join(directoryPath, newFilename);
    
    // 如果物理文件存在，则重命名物理文件
    try {
      // 检查原始文件是否存在
      await fs.access(file.path);
      // 重命名文件
      await fs.rename(file.path, newPath);
    } catch (fsError) {
      console.error('文件系统操作错误:', fsError);
      // 如果文件不存在，只更新数据库记录，不返回错误
    }
    
    // 更新数据库记录
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        name: newName.trim(), // 更新显示名称
        filename: newFilename, // 更新文件名
        path: newPath, // 更新文件路径
        url: generateFileUrl(fileId), // 确保URL正确更新
        tags: uniqueTags || file.tags, // 使用去重后的标签
      },
    });

    return NextResponse.json({
      success: true,
      message: '重命名成功',
      data: mapFileEntityToFileInfo(updatedFile)
    });
  } catch (error) {
    console.error('重命名错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '重命名失败，请稍后重试' 
      },
      { status: 500 }
    );
  }
} 