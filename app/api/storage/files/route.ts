/**
 * 文件API路由
 * 处理文件相关请求
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/database';
import { FileManagementService, FileUploadService } from '@/app/services/storage';

const managementService = new FileManagementService();
const uploadService = new FileUploadService();

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
    
    // 检查是否强制刷新
    const hasTimestamp = searchParams.has('_t');

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
 * 文件上传处理
 */
export async function POST(request: NextRequest) {
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
    
    const formData = await request.formData();
    const files = formData.getAll('file');
    const tagsJson = formData.get('tags');
    const folderId = formData.get('folderId')?.toString() || null;
    
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
    
    // 处理单个文件上传
    if (files.length === 1) {
      const file = files[0] as File;
      const result = await uploadService.uploadFile(user.id, file, folderId, tags);
      return NextResponse.json({ 
        success: true, 
        data: result 
      });
    }
    
    // 处理批量上传
    const results = [];
    for (const fileData of files) {
      const file = fileData as File;
      try {
        const result = await uploadService.uploadFile(user.id, file, folderId, tags);
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