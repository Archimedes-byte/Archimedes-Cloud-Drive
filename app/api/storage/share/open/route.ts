import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/database';

/**
 * 处理打开分享链接
 * POST /api/storage/share/open
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { shareLink, extractCode } = body;

    if (!shareLink) {
      return NextResponse.json({ error: '请提供分享链接' }, { status: 400 });
    }

    // 从分享链接中提取分享码
    let shareCode = '';
    try {
      // 尝试从URL中提取分享码，格式可能是 https://example.com/share/{shareCode} 或其他格式
      const url = new URL(shareLink);
      const pathSegments = url.pathname.split('/');
      shareCode = pathSegments[pathSegments.length - 1];
    } catch (error) {
      // 如果不是有效的URL，尝试直接使用输入的内容作为分享码
      shareCode = shareLink.trim();
    }

    if (!shareCode) {
      return NextResponse.json({ error: '无效的分享链接' }, { status: 400 });
    }

    // 查询数据库验证分享码
    const share = await prisma.fileShare.findUnique({
      where: { shareCode },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 如果分享不存在
    if (!share) {
      return NextResponse.json({ 
        success: false, 
        error: '分享链接不存在或已失效' 
      });
    }

    // 检查分享是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: '分享链接已过期' 
      });
    }

    // 检查访问次数是否超限
    if (share.accessLimit !== null && share.accessCount >= share.accessLimit) {
      return NextResponse.json({ 
        success: false, 
        error: '分享链接访问次数已达上限' 
      });
    }
    
    // 检查是否需要提取码
    const needsExtractCode = share.extractCode && !share.autoFillCode;
    
    // 如果需要提取码但未提供
    if (needsExtractCode && !extractCode) {
      return NextResponse.json({
        success: false,
        error: '请提供提取码',
        needsExtractCode: true
      });
    }
    
    // 如果提取码不正确
    if (needsExtractCode && extractCode !== share.extractCode) {
      return NextResponse.json({
        success: false,
        error: '提取码错误',
        needsExtractCode: true
      });
    }
    
    // 增加访问次数
    await prisma.fileShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 } }
    });

    // 准备文件数据
    const files = share.files.map(fileLink => {
      const file = fileLink.file;
      return {
        id: file.id,
        name: file.name,
        size: file.size || 0,
        type: file.type || '',
        isFolder: file.isFolder,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        path: file.path,
      };
    });

    // 返回成功数据
    return NextResponse.json({
      success: true,
      shareInfo: {
        id: share.id,
        shareCode: share.shareCode,
        files,
        createdAt: share.createdAt.toISOString(),
        createdBy: share.userId,
        expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
      }
    });
  } catch (error) {
    console.error('验证分享链接时出错:', error);
    return NextResponse.json(
      { error: '验证分享链接失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 