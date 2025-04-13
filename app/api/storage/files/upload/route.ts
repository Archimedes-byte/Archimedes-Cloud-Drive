/**
 * 文件上传API路由
 * 直接处理文件上传请求而不是转发
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { StorageService } from '@/app/services/storage-service';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60;

const storageService = new StorageService();

/**
 * 文件上传处理 - 直接处理而不是转发
 * 不使用withAuth中间件，直接实现认证逻辑
 */
export async function POST(request: NextRequest) {
  try {
    console.log('接收到文件上传请求');
    
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: '未授权访问' 
      }, { status: 401 });
    }
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在' 
      }, { status: 404 });
    }
    
    const formData = await request.formData();
    const files = formData.getAll('file');
    const tagsJson = formData.get('tags');
    const folderId = formData.get('folderId')?.toString() || null;
    const isFolderUpload = formData.get('isFolderUpload') === 'true';
    
    // 处理标签
    let tags: string[] = [];
    if (tagsJson && typeof tagsJson === 'string') {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        console.error('解析标签JSON失败:', e);
      }
    }
    
    // 验证文件
    if (!files || files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未提供文件' 
      }, { status: 400 });
    }

    // 获取文件路径信息（用于文件夹上传）
    const pathsMap = new Map<number, string>();
    if (isFolderUpload) {
      // 收集所有路径信息
      for (let i = 0; i < files.length; i++) {
        const pathKey = `paths_${i}`;
        const pathValue = formData.get(pathKey);
        if (typeof pathValue === 'string') {
          pathsMap.set(i, pathValue);
        }
      }
      console.log(`收集到 ${pathsMap.size} 条路径信息`);
    }
    
    // 如果是文件夹上传，需要先创建文件夹结构
    if (isFolderUpload && pathsMap.size > 0) {
      const folderCache = new Map<string, string>(); // 路径到文件夹ID的映射
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i] as File;
        let currentParentId = folderId;
        
        // 获取文件相对路径
        const relativePath = pathsMap.get(i);
        if (relativePath && relativePath.includes('/')) {
          const pathParts = relativePath.split('/').filter(Boolean);
          
          if (pathParts.length > 0) {
            // 最后一个部分是文件名，前面的是文件夹路径
            const folderParts = pathParts.slice(0, -1);
            
            if (folderParts.length > 0) {
              let currentPath = '';
              
              // 逐级创建或查找文件夹
              for (let j = 0; j < folderParts.length; j++) {
                const folderName = folderParts[j];
                currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
                
                // 检查缓存中是否存在此路径的文件夹
                if (folderCache.has(currentPath)) {
                  currentParentId = folderCache.get(currentPath) as string;
                  continue;
                }
                
                // 检查数据库中是否已存在此文件夹
                let folder = await prisma.file.findFirst({
                  where: {
                    name: folderName,
                    parentId: currentParentId,
                    uploaderId: user.id,
                    isFolder: true,
                    isDeleted: false
                  }
                });
                
                // 如果不存在，则创建文件夹
                if (!folder) {
                  const newFolderId = uuidv4();
                  
                  // 构建文件夹路径
                  const parentFolder = currentParentId ? 
                    await prisma.file.findUnique({ 
                      where: { id: currentParentId },
                      select: { path: true } 
                    }) : null;
                  
                  const folderPath = parentFolder ? 
                    `${parentFolder.path === '/' ? '' : parentFolder.path}/${folderName}` : 
                    `/${folderName}`;
                  
                  folder = await prisma.file.create({
                    data: {
                      id: newFolderId,
                      name: folderName,
                      filename: folderName,
                      path: folderPath,
                      type: 'folder',
                      size: 0,
                      isFolder: true,
                      uploaderId: user.id,
                      parentId: currentParentId,
                      tags: [],
                      url: null,
                      updatedAt: new Date()
                    }
                  });
                }
                
                // 更新当前父文件夹ID和缓存
                currentParentId = folder.id;
                folderCache.set(currentPath, folder.id);
              }
            }
          }
        }
        
        // 上传文件到正确的文件夹
        try {
          // 使用原始文件名而不是经过处理的文件名
          // 从路径信息中提取文件名，而不是重新生成
          const fileName = pathsMap.get(i) ? pathsMap.get(i)!.split('/').pop()! : file.name;
          
          // 传递原始文件名作为可选参数
          const result = await storageService.uploadFile(
            user.id, 
            file, 
            currentParentId, 
            tags, 
            fileName // 传递原始文件名参数
          );
          results.push(result);
        } catch (error: any) {
          console.error(`上传文件 ${file.name} 失败:`, error);
          // 继续处理其他文件
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        data: results 
      });
    }
    
    // 处理单个文件上传（非文件夹模式）
    if (files.length === 1) {
      const file = files[0] as File;
      const result = await storageService.uploadFile(user.id, file, folderId, tags);
      return NextResponse.json({ 
        success: true, 
        data: result 
      });
    }
    
    // 处理批量上传（非文件夹模式）
    const results = [];
    for (const fileData of files) {
      const file = fileData as File;
      try {
        const result = await storageService.uploadFile(user.id, file, folderId, tags);
        results.push(result);
      } catch (error: any) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        // 继续处理其他文件
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: results 
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '文件上传失败', 
      message: error.message || '未知错误' 
    }, { status: 500 });
  }
} 