import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { rename } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { ApiResponse, FileInfo, mapFileEntityToFileInfo } from '@/app/shared/types';
import { generateFileUrl } from '@/app/lib/file/paths';

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

    // 判断是否是文件夹
    if (file.isFolder) {
      // 更新文件夹名称和标签
      const updatedFolder = await prisma.file.update({
        where: { id: fileId },
        data: {
          name: newName,
          tags: tags || file.tags, // 如果提供了标签则更新
        },
      });

      return NextResponse.json({
        success: true,
        message: '重命名成功',
        data: mapFileEntityToFileInfo(updatedFolder)
      });
    }

    // 构建新的文件路径
    const oldPath = join(process.cwd(), file.path);
    
    // 正确处理文件路径，保持目录结构不变，只替换文件名
    const dirPath = dirname(oldPath);
    // 保持原始的文件名格式（包含唯一标识符）
    const oldBasename = basename(oldPath);
    const fileExtension = oldBasename.substring(oldBasename.lastIndexOf('.'));
    
    // 生成新的唯一文件名（保持原有格式但替换显示名）
    // 注意我们不改变物理文件名，只改变显示名，所以不需要重命名文件系统上的文件
    
    // 更新数据库记录
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        name: newName, // 更新显示名称
        // filename和path保持不变，文件在文件系统中的位置和名称不变
        url: generateFileUrl(fileId), // 确保URL正确更新
        tags: tags || file.tags, // 如果提供了标签则更新
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