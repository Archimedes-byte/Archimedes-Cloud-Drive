import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    // 验证用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // 获取请求体数据
    const { name, parentId, tags } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '文件夹名称不能为空' },
        { status: 400 }
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
          { error: '父文件夹不存在或无权限访问' },
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

    // 处理标签
    const processedTags = tags?.trim() 
      ? tags.split(',').map((tag: string) => tag.trim())
      : [];

    // 创建文件夹
    const folder = await prisma.file.create({
      data: {
        name,
        filename: name,
        type: 'folder',
        size: 0,
        isFolder: true,
        uploaderId: user.id,
        parentId: parentId || null,
        path: folderPath,
        tags: processedTags,
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    return NextResponse.json(
      { error: '创建文件夹失败' },
      { status: 500 }
    );
  }
} 