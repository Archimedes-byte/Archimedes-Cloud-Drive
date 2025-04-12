import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { FolderPathItem } from '@/app/types';

/**
 * 用于路径构建的简化文件夹接口
 */
interface FolderForPath {
  id: string;
  name: string;
  parentId: string | null;
}

/**
 * 获取文件夹路径
 * 
 * 此API返回从根目录到指定文件夹的完整路径
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

    // 检查文件夹是否存在且属于当前用户
    const folder = await prisma.file.findFirst({
      where: {
        id: params.id,
        uploaderId: user.id,
        isFolder: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { 
          success: false,
          error: '文件夹不存在或无权限访问' 
        },
        { status: 404 }
      );
    }

    // 获取所有文件夹，用于构建路径
    const allFolders = await prisma.file.findMany({
      where: {
        uploaderId: user.id,
        isFolder: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    // 构建文件夹ID到文件夹映射
    const folderMap = new Map<string, FolderForPath>();
    allFolders.forEach(folder => folderMap.set(folder.id, folder));

    // 构建路径
    const pathItems: FolderPathItem[] = [];
    let currentFolder: FolderForPath | undefined = folder;

    // 从当前文件夹开始，向上追溯父文件夹直到根目录
    while (currentFolder) {
      pathItems.unshift({
        id: currentFolder.id,
        name: currentFolder.name
      });

      // 如果有父文件夹，继续追溯
      if (currentFolder.parentId) {
        currentFolder = folderMap.get(currentFolder.parentId);
      } else {
        // 已到达根目录
        break;
      }
    }

    return NextResponse.json({
      success: true,
      path: pathItems
    });
  } catch (error) {
    console.error('获取文件夹路径失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取文件夹路径失败' 
      },
      { status: 500 }
    );
  }
} 