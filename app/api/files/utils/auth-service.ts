/**
 * 用户验证服务
 * 
 * 提供API请求的用户身份验证和权限检查功能
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

/**
 * 验证用户，并返回用户对象
 */
export async function validateUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return {
      error: new NextResponse(
        JSON.stringify({ error: '未授权' }), 
        { status: 401, headers: { 'content-type': 'application/json' } }
      ),
      user: null
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return {
      error: new NextResponse(
        JSON.stringify({ error: '用户不存在' }), 
        { status: 404, headers: { 'content-type': 'application/json' } }
      ),
      user: null
    };
  }

  return { error: null, user };
}

/**
 * 验证文件夹访问权限
 */
export async function validateFolderAccess(folderId: string, userId: string) {
  if (!folderId) return { error: null, folder: null };

  const folder = await prisma.file.findFirst({
    where: {
      id: folderId,
      uploaderId: userId,
      isFolder: true,
      isDeleted: false
    }
  });

  if (!folder) {
    return {
      error: new NextResponse(
        JSON.stringify({ error: '文件夹不存在或无权访问' }), 
        { status: 404, headers: { 'content-type': 'application/json' } }
      ),
      folder: null
    };
  }

  return { error: null, folder };
}

/**
 * 验证存储空间是否足够
 */
export async function validateStorageSpace(userId: string, fileSize: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, storageLimit: true }
  });

  if (!user) {
    return {
      error: new NextResponse(
        JSON.stringify({ error: '用户不存在' }), 
        { status: 404, headers: { 'content-type': 'application/json' } }
      ),
      hasSpace: false
    };
  }

  if (user.storageUsed + fileSize > user.storageLimit) {
    return {
      error: new NextResponse(
        JSON.stringify({ 
          error: '存储空间不足',
          details: {
            used: user.storageUsed,
            limit: user.storageLimit,
            required: fileSize,
            available: user.storageLimit - user.storageUsed
          }
        }), 
        { status: 400, headers: { 'content-type': 'application/json' } }
      ),
      hasSpace: false
    };
  }

  return { error: null, hasSpace: true };
}

/**
 * 验证文件请求
 */
export async function validateFileRequest(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    return {
      error: new NextResponse(
        JSON.stringify({ error: '未找到文件' }), 
        { status: 400, headers: { 'content-type': 'application/json' } }
      ),
      file: null
    };
  }

  return { error: null, file };
} 