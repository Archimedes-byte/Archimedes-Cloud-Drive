/**
 * 文件上传API路由
 * 专用上传处理API - 系统上传文件的标准接口
 * 
 * 这个API处理以下功能:
 * 1. 单个文件上传
 * 2. 多个文件批量上传
 * 3. 文件夹结构上传(包括自动创建文件夹)
 * 
 * 系统架构说明:
 * - 所有文件上传应使用此API，而非通用files API
 * - 在文件夹上传场景中，会根据需要自动创建缺失的文件夹结构
 * - 单独创建文件夹应使用 POST /api/storage/folders 接口
 * 
 * 文件夹创建逻辑仅在isFolderUpload=true时激活，用于:
 * - 保持原始文件夹结构
 * - 在上传时自动创建必要的文件夹层级
 * - 确保文件被放置在正确的路径中
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { FileUploadService } from '@/app/services/storage';
import { v4 as uuidv4 } from 'uuid';
import { FileInfo } from '@/app/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60;

const uploadService = new FileUploadService();

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
      const results: FileInfo[] = [];
      
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
                  // 创建文件夹
                  const folderInfo = await uploadService.createFolder(
                    user.id,
                    folderName,
                    currentParentId,
                    tags
                  );
                  
                  // 使用创建的文件夹信息更新folder引用
                  folder = {
                    id: folderInfo.id,
                    path: folderInfo.path || '/',
                    // 添加其他必要的字段，以满足后续使用需求
                    name: folderInfo.name,
                    isFolder: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  } as any;
                  
                  console.log(`[上传] 文件夹创建成功, ID: ${folderInfo.id}`);
                } else {
                  console.log(`[上传] 文件夹已存在, ID: ${folder.id}`);
                }
                
                // 此时folder一定不为null，因为要么从数据库找到，要么新创建
                // 更新当前父文件夹ID和缓存
                currentParentId = folder!.id;
                folderCache.set(currentPath, folder!.id);
                console.log(`[上传] 更新文件夹缓存: ${currentPath} -> ${folder!.id}`);
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
          const fileInfo = await uploadService.uploadFile(
            user.id,
            file,
            currentParentId,
            tags,
            fileName
          );
          console.timeEnd(`[上传] 文件 ${i+1}/${files.length} 处理时间`);
          
          console.log(`[上传] 文件上传成功，ID: ${fileInfo.id}`);
          results.push(fileInfo);
        } catch (error) {
          console.error(`[上传] 上传文件 ${file.name} 失败:`, error);
        }
      }
      
      console.log(`[上传] 文件夹上传处理完成，成功上传 ${results.length}/${files.length} 个文件`);
      const elapsedTime = Date.now() - startTime;
      console.log(`[上传] 总耗时: ${elapsedTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        data: results,
        stats: {
          totalFiles: files.length,
          uploadedFiles: results.length,
          elapsedTime: elapsedTime
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    // 常规文件上传处理
    console.log('[上传] 开始常规文件上传处理');
    if (files.length === 1) {
      // 单个文件上传
      const file = files[0] as File;
      console.log(`[上传] 上传单个文件: ${file.name}`);
      
      const result = await uploadService.uploadFile(user.id, file, folderId, tags);
      
      const elapsedTime = Date.now() - startTime;
      console.log(`[上传] 单个文件上传完成，ID: ${result.id}，耗时: ${elapsedTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        data: result 
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } else {
      // 批量上传
      console.log(`[上传] 开始批量上传 ${files.length} 个文件`);
      const results: FileInfo[] = [];
      
      for (const fileData of files) {
        const file = fileData as File;
        try {
          console.log(`[上传] 上传文件: ${file.name}`);
          console.time(`[上传] 文件 ${file.name} 处理时间`);
          
          const result = await uploadService.uploadFile(user.id, file, folderId, tags);
          
          console.timeEnd(`[上传] 文件 ${file.name} 处理时间`);
          console.log(`[上传] 文件上传成功，ID: ${result.id}`);
          
          results.push(result);
        } catch (error: any) {
          console.error(`[上传] 上传文件 ${file.name} 失败:`, error);
          // 继续处理其他文件
        }
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`[上传] 批量上传完成，成功上传 ${results.length}/${files.length} 个文件，总耗时: ${elapsedTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        data: results,
        stats: {
          totalFiles: files.length,
          uploadedFiles: results.length,
          elapsedTime: elapsedTime
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error(`[上传] 文件上传过程出错，耗时: ${elapsedTime}ms，错误:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: '文件上传失败', 
      message: error.message || '未知错误' 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
} 