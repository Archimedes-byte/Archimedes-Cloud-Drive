import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/prisma';

/**
 * 获取分享文件夹内容
 * POST /api/storage/share/folder
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    const { shareCode, extractCode, folderId } = data;

    // 验证参数
    if (!shareCode || !extractCode || !folderId) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
    }

    // 查询分享记录
    const share = await db.fileShare.findFirst({
      where: {
        shareCode,
        extractCode,
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 分享不存在或提取码错误
    if (!share) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在或提取码错误' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: '分享链接已过期' },
        { status: 403 }
      );
    }

    // 验证文件夹是否在分享列表中
    const sharedFolder = share.files.find(f => f.file.id === folderId && f.file.isFolder);
    if (!sharedFolder) {
      // 检查是否是子文件夹
      const isSubfolder = await checkIsSubfolder(share, folderId);
      if (!isSubfolder) {
        return NextResponse.json(
          { success: false, error: '请求的文件夹不在分享列表中' },
          { status: 404 }
        );
      }
    }

    // 获取文件夹内容
    const folderContents = await db.file.findMany({
      where: {
        parentId: folderId,
        isDeleted: false
      },
      orderBy: [
        { isFolder: 'desc' },
        { name: 'asc' }
      ]
    });

    // 返回文件夹内容
    return NextResponse.json({
      success: true,
      data: {
        contents: folderContents.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type || '',
          size: file.size || 0,
          isFolder: file.isFolder,
          createdAt: file.createdAt
        })),
        folderId: folderId,
        folderName: sharedFolder ? sharedFolder.file.name : await getFolderName(folderId)
      }
    });
  } catch (error) {
    console.error('获取文件夹内容失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文件夹内容失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * 检查一个文件夹是否是分享文件夹的子文件夹
 */
async function checkIsSubfolder(share: any, folderId: string): Promise<boolean> {
  // 获取分享中的所有文件夹
  const sharedFolders = share.files
    .filter((f: any) => f.file.isFolder)
    .map((f: any) => f.file.id);

  if (sharedFolders.length === 0) return false;

  // 递归检查父文件夹
  const folder = await db.file.findUnique({
    where: { id: folderId },
    select: { parentId: true }
  });

  if (!folder || !folder.parentId) return false;

  // 如果直接父文件夹是分享的文件夹，则返回true
  if (sharedFolders.includes(folder.parentId)) return true;

  // 否则递归检查
  return checkIsSubfolder(share, folder.parentId);
}

/**
 * 获取文件夹名称
 */
async function getFolderName(folderId: string): Promise<string> {
  const folder = await db.file.findUnique({
    where: { id: folderId },
    select: { name: true }
  });
  return folder?.name || '未知文件夹';
} 