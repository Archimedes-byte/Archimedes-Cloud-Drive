import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { ApiResponse, FileInfo, FileListResponse, SearchFilesRequest } from '@/app/types';

export async function GET(request: Request): Promise<NextResponse<FileListResponse>> {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type');

    console.log(`搜索请求参数: query=${query}, type=${type}`);

    // 构建查询条件
    const baseWhere = {
      uploaderId: user.id,
      isDeleted: false,
    };

    let files = [];

    // 根据搜索类型执行不同的查询
    if (type === 'tag') {
      // 标签搜索 - 使用hasSome查询标签数组
      console.log(`执行标签搜索，标签: ${query}`);
      
      files = await prisma.file.findMany({
        where: {
          ...baseWhere,
          tags: {
            hasSome: [query.trim()]
          }
        },
        orderBy: [
          { isFolder: 'desc' }, // 文件夹优先
          { createdAt: 'desc' }
        ]
      });
      
      console.log(`标签搜索结果数量: ${files.length}`);
      
      // 如果精确标签搜索没有结果，尝试进行模糊标签搜索
      if (files.length === 0) {
        console.log('尝试进行模糊标签搜索');
        
        // 获取所有文件的所有标签
        const allFiles = await prisma.file.findMany({
          where: baseWhere,
          select: {
            id: true,
            tags: true
          }
        });
        
        // 将标签转为小写进行模糊匹配
        const searchTerm = query.trim().toLowerCase();
        
        // 找到标签部分匹配的文件ID
        const matchedFileIds = allFiles
          .filter(file => 
            Array.isArray(file.tags) && 
            file.tags.some(tag => 
              tag.toLowerCase().includes(searchTerm)
            )
          )
          .map(file => file.id);
        
        console.log(`模糊标签匹配找到 ${matchedFileIds.length} 个文件`);
        
        // 如果有匹配的文件ID，查询完整文件信息
        if (matchedFileIds.length > 0) {
          files = await prisma.file.findMany({
            where: {
              id: { in: matchedFileIds }
            },
            orderBy: [
              { isFolder: 'desc' },
              { createdAt: 'desc' }
            ]
          });
          
          console.log(`模糊标签搜索结果数量: ${files.length}`);
        }
      }
    } else {
      // 文件名搜索
      console.log(`执行文件名搜索，关键词: ${query}`);
      
      files = await prisma.file.findMany({
        where: {
          ...baseWhere,
          name: {
            contains: query,
            mode: 'insensitive', // 不区分大小写
          }
        },
        orderBy: [
          { isFolder: 'desc' }, // 文件夹优先
          { createdAt: 'desc' }
        ]
      });
      
      console.log(`文件名搜索结果数量: ${files.length}`);
    }

    // 收集所有需要查询的父文件ID
    const parentIds = files
      .filter(file => file.parentId)
      .map(file => file.parentId as string);
    
    // 如果有父文件ID，查询这些父文件信息
    const parentMap = new Map();
    if (parentIds.length > 0) {
      const parentFiles = await prisma.file.findMany({
        where: {
          id: { in: parentIds }
        },
        select: {
          id: true,
          name: true,
          path: true
        }
      });
      
      // 构建ID到父文件信息的映射
      for (const parent of parentFiles) {
        parentMap.set(parent.id, parent);
      }
    }

    // 增强处理父文件夹路径
    const processedFiles = files.map(file => {
      let pathInfo = '/';
      
      // 如果文件有父级，从parentMap中获取父级信息
      if (file.parentId && parentMap.has(file.parentId)) {
        const parent = parentMap.get(file.parentId);
        pathInfo = parent.path || parent.name || '/';
        
        // 确保路径格式一致，以/开头
        if (pathInfo !== '/' && !pathInfo.startsWith('/')) {
          pathInfo = `/${pathInfo}`;
        }
      }
      
      // 返回包含正确路径的文件信息
      return {
        ...file,
        parentPath: pathInfo
      };
    });

    // 格式化返回数据
    const formattedFiles: FileInfo[] = processedFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type || '',
      size: file.size || 0,
      url: file.url || '',
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      parentId: file.parentId,
      tags: file.tags || [],
      isFolder: file.isFolder,
      path: file.parentPath || '/',  // 使用处理后的路径
    }));

    // 记录结果统计信息
    const folderCount = formattedFiles.filter(f => f.isFolder).length;
    const fileCount = formattedFiles.length - folderCount;
    console.log(`搜索结果: 共${formattedFiles.length}个项目，其中文件夹${folderCount}个，文件${fileCount}个`);

    return NextResponse.json({
      success: true,
      data: formattedFiles
    });
  } catch (error) {
    console.error('搜索文件失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '搜索文件失败' 
      },
      { status: 500 }
    );
  }
} 