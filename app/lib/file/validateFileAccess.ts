/**
 * 验证用户对文件的访问权限
 */

import { prisma } from '@/app/lib/prisma';

interface FileInfo {
  id: string;
  userId?: string;
  uploaderId?: string;
  isPublic?: boolean;
}

/**
 * 验证用户是否有权限访问指定文件
 * 
 * @param file 文件信息
 * @param userId 当前用户ID
 * @returns 是否有访问权限
 */
export async function validateFileAccess(file: FileInfo, userId: string): Promise<boolean> {
  try {
    // 如果文件是公开的，任何人都可以访问
    if (file.isPublic) {
      return true;
    }

    // 如果用户是文件的上传者/所有者，可以访问
    const fileOwnerId = file.userId || file.uploaderId;
    if (fileOwnerId === userId) {
      return true;
    }

    // 检查文件是否被共享给了该用户
    const share = await prisma.share.findFirst({
      where: {
        fileId: file.id,
        sharedToId: userId,
        // 确保共享未过期
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    return !!share;
  } catch (error) {
    console.error('验证文件访问权限时出错:', error);
    return false;
  }
} 