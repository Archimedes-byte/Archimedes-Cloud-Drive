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
  console.log('===== 文件上传处理开始 =====');
  const startTime = Date.now();
  
  try {
    console.log('[上传] 接收到文件上传请求');
    
    // 获取用户会话
    console.log('[上传] 开始验证用户会话');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('[上传] 用户会话无效，未授权访问');
      return NextResponse.json({ 
        success: false, 
        error: '未授权访问' 
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    console.log(`[上传] 用户会话有效，用户: ${session.user.email}`);
    
    // 获取用户信息
    console.log('[上传] 从数据库获取用户信息');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    
    if (!user) {
      console.log('[上传] 用户在数据库中不存在');
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在' 
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    console.log(`[上传] 用户信息有效，ID: ${user.id}, 名称: ${user.name}`);
    
    // 解析请求表单数据
    console.log('[上传] 开始解析表单数据');
    const formData = await request.formData();
    const files = formData.getAll('file');
    const tagsJson = formData.get('tags');
    const folderId = formData.get('folderId')?.toString() || null;
    const isFolderUpload = formData.get('isFolderUpload') === 'true';
    
    console.log(`[上传] 表单数据解析完成: 
      - 文件数量: ${files.length}
      - 目标文件夹ID: ${folderId || '根目录'}
      - 是否文件夹上传: ${isFolderUpload}
      - 包含标签数据: ${!!tagsJson}`);
    
    // 处理标签
    let tags: string[] = [];
    if (tagsJson && typeof tagsJson === 'string') {
      try {
        tags = JSON.parse(tagsJson);
        console.log(`[上传] 解析标签成功: ${tags.join(', ')}`);
      } catch (e) {
        console.error('[上传] 解析标签JSON失败:', e);
      }
    }
    
    // 验证文件
    if (!files || files.length === 0) {
      console.log('[上传] 未提供文件');
      return NextResponse.json({ 
        success: false, 
        error: '未提供文件' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 记录文件信息
    files.forEach((file: any, index) => {
      console.log(`[上传] 文件 ${index + 1}/${files.length}: 
        - 名称: ${file.name} 
        - 类型: ${file.type} 
        - 大小: ${(file.size / 1024).toFixed(2)} KB`);
    });

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
      console.log(`[上传] 收集到 ${pathsMap.size} 条路径信息`);
      
      // 输出部分路径信息示例
      if (pathsMap.size > 0) {
        Array.from(pathsMap.entries())
          .slice(0, Math.min(5, pathsMap.size))
          .forEach(([index, path]) => {
            console.log(`[上传] 路径示例 ${index}: ${path}`);
          });
      }
    }
    
    // 如果是文件夹上传，需要先创建文件夹结构
    if (isFolderUpload && pathsMap.size > 0) {
      console.log('[上传] 开始处理文件夹上传');
      const folderCache = new Map<string, string>(); // 路径到文件夹ID的映射
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i] as File;
        let currentParentId = folderId;
        
        // 获取文件相对路径
        const relativePath = pathsMap.get(i);
        console.log(`[上传] 处理文件 ${i + 1}/${files.length}: ${file.name}, 路径: ${relativePath || '无路径'}`);
        
        if (relativePath && relativePath.includes('/')) {
          const pathParts = relativePath.split('/').filter(Boolean);
          
          if (pathParts.length > 0) {
            // 最后一个部分是文件名，前面的是文件夹路径
            const folderParts = pathParts.slice(0, -1);
            
            if (folderParts.length > 0) {
              console.log(`[上传] 需要创建/查找文件夹结构: ${folderParts.join('/')}`);
              let currentPath = '';
              
              // 逐级创建或查找文件夹
              for (let j = 0; j < folderParts.length; j++) {
                const folderName = folderParts[j];
                currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
                
                // 检查缓存中是否存在此路径的文件夹
                if (folderCache.has(currentPath)) {
                  currentParentId = folderCache.get(currentPath) as string;
                  console.log(`[上传] 文件夹缓存命中: ${currentPath} -> ${currentParentId}`);
                  continue;
                }
                
                // 检查数据库中是否已存在此文件夹
                console.log(`[上传] 在数据库中查找文件夹: ${folderName}, 父级ID: ${currentParentId || '根目录'}`);
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
                  console.log(`[上传] 需要创建新文件夹: ${folderName}`);
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
                  
                  console.log(`[上传] 创建文件夹: ${folderName}, 路径: ${folderPath}`);
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
                  console.log(`[上传] 文件夹创建成功, ID: ${folder.id}`);
                } else {
                  console.log(`[上传] 文件夹已存在, ID: ${folder.id}`);
                }
                
                // 更新当前父文件夹ID和缓存
                currentParentId = folder.id;
                folderCache.set(currentPath, folder.id);
                console.log(`[上传] 更新文件夹缓存: ${currentPath} -> ${folder.id}`);
              }
            }
          }
        }
        
        // 上传文件到正确的文件夹
        try {
          // 使用原始文件名而不是经过处理的文件名
          // 从路径信息中提取文件名，而不是重新生成
          const fileName = pathsMap.get(i) ? pathsMap.get(i)!.split('/').pop()! : file.name;
          
          console.log(`[上传] 开始上传文件: ${fileName} 到文件夹ID: ${currentParentId || '根目录'}`);
          console.time(`[上传] 文件 ${i+1}/${files.length} 处理时间`);
          
          // 传递原始文件名作为可选参数
          const result = await storageService.uploadFile(
            user.id, 
            file, 
            currentParentId, 
            tags, 
            fileName // 传递原始文件名参数
          );
          
          console.timeEnd(`[上传] 文件 ${i+1}/${files.length} 处理时间`);
          console.log(`[上传] 文件上传成功: ${fileName}, 文件ID: ${result.id}`);
          
          results.push(result);
        } catch (error: any) {
          console.error(`[上传] 上传文件 ${file.name} 失败:`, error);
          // 继续处理其他文件
        }
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`[上传] 文件夹上传处理完成, 成功文件数: ${results.length}/${files.length}, 耗时: ${elapsed}ms`);
      
      return NextResponse.json({ 
        success: true, 
        data: results 
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 处理单个文件上传（非文件夹模式）
    if (files.length === 1) {
      const file = files[0] as File;
      console.log(`[上传] 开始上传单个文件: ${file.name}`);
      console.time('[上传] 单个文件处理时间');
      
      const result = await storageService.uploadFile(user.id, file, folderId, tags);
      
      console.timeEnd('[上传] 单个文件处理时间');
      console.log(`[上传] 单个文件上传成功, 文件ID: ${result.id}`);
      
      const elapsed = Date.now() - startTime;
      console.log(`[上传] 单个文件上传处理完成, 耗时: ${elapsed}ms`);
      
      return NextResponse.json({ 
        success: true, 
        data: result 
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 处理批量上传（非文件夹模式）
    console.log(`[上传] 开始批量上传 ${files.length} 个文件`);
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File;
      try {
        console.log(`[上传] 处理批量文件 ${i+1}/${files.length}: ${file.name}`);
        console.time(`[上传] 批量文件 ${i+1}/${files.length} 处理时间`);
        
        const result = await storageService.uploadFile(user.id, file, folderId, tags);
        
        console.timeEnd(`[上传] 批量文件 ${i+1}/${files.length} 处理时间`);
        console.log(`[上传] 批量文件上传成功, 文件ID: ${result.id}`);
        
        results.push(result);
      } catch (error: any) {
        console.error(`[上传] 上传文件 ${file.name} 失败:`, error);
        // 继续处理其他文件
      }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[上传] 批量上传处理完成, 成功文件数: ${results.length}/${files.length}, 耗时: ${elapsed}ms`);
    
    return NextResponse.json({ 
      success: true, 
      data: results 
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[上传] 文件上传失败, 耗时: ${elapsed}ms, 错误:`, error);
    
    // 详细记录错误信息
    console.error('[上传] 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return NextResponse.json({ 
      success: false, 
      error: '文件上传失败', 
      message: error.message || '未知错误',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code
      } : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } finally {
    console.log('===== 文件上传处理结束 =====');
  }
} 