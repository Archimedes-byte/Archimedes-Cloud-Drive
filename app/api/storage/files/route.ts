/**
 * 文件API路由
 * 处理文件相关请求
 * 
 * 该API主要用于:
 * 1. 获取文件和文件夹列表(GET)
 * 2. 重定向上传请求到专用上传API(POST)
 * 
 * 注意：系统中存在两套相关API:
 * - /api/storage/files - 处理所有类型的存储项(文件和文件夹)
 * - /api/storage/folders - 专门处理文件夹
 * 
 * 文件创建在系统中有两种方式:
 * 1. 通过/api/storage/files/upload专用上传API上传文件
 * 2. 通过/api/storage/folders接口创建文件夹
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { FileManagementService } from '@/app/services/storage';

const managementService = new FileManagementService();

/**
 * 获取文件列表
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const type = searchParams.get('type');
    const page = searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1;
    const pageSize = searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    console.log('收到查询参数:', Object.fromEntries(searchParams));
    
    // 获取文件列表
    const result = await managementService.getFiles(
      user.id,
      folderId,
      type,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    // 添加防缓存响应头
    return NextResponse.json({
      success: true,
      data: result
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取文件列表失败', 
      message: error.message || '未知错误' 
    }, { status: 500 });
  }
}

/**
 * 文件上传处理 - 重定向到专用上传API
 * 此方法统一重定向到 /api/storage/files/upload 以避免功能重复
 */
export async function POST(request: NextRequest) {
  console.log('接收到文件上传请求，重定向到专用上传API');
  
  // 创建重定向URL
  const uploadApiUrl = new URL('/api/storage/files/upload', request.url);
  
  // 301表示永久重定向，客户端应该更新他们的书签
  return NextResponse.redirect(uploadApiUrl.toString(), 301);
} 