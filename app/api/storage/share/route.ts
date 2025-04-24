import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/lib/database';
import { randomString } from '@/app/utils/string';
import { getErrorMessage } from '@/app/utils/errors';

/**
 * 创建分享
 * POST /api/storage/share
 */
export async function POST(request: NextRequest) {
  try {
    // 验证会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // 获取请求数据
    const data = await request.json();
    const { fileIds, expiryDays, extractCode, accessLimit, autoRefreshCode } = data;

    // 验证参数
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要分享的文件' },
        { status: 400 }
      );
    }

    // 验证文件归属权
    const userId = session.user.id;
    const files = await db.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: userId
      }
    });

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { success: false, error: '部分文件不存在或没有权限' },
        { status: 403 }
      );
    }

    // 生成随机分享码
    const shareCode = randomString(12);
    
    // 生成提取码（如果没有指定）
    const finalExtractCode = extractCode || randomString(4, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    
    // 计算过期时间
    const expiresAt = expiryDays === -1 
      ? null 
      : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    // 创建分享记录
    const share = await db.fileShare.create({
      data: {
        shareCode,
        extractCode: finalExtractCode,
        expiresAt,
        accessLimit,
        autoFillCode: autoRefreshCode,
        userId,
        files: {
          create: fileIds.map(fileId => ({
            file: { connect: { id: fileId } }
          }))
        }
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 构建分享链接
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || '';
    const shareLink = `${baseUrl}/s/${shareCode}`;
    const shareLinkWithCode = autoRefreshCode ? `${shareLink}?code=${finalExtractCode}` : shareLink;

    return NextResponse.json({
      success: true,
      data: {
        shareLink: shareLinkWithCode,
        extractCode: finalExtractCode,
        expiresAt: share.expiresAt
      }
    });
  } catch (error) {
    console.error('创建分享失败:', error);
    return NextResponse.json(
      { success: false, error: '创建分享失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * 获取分享列表
 * GET /api/storage/share
 */
export async function GET(request: NextRequest) {
  try {
    // 验证会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // 获取用户的分享列表
    const shares = await db.fileShare.findMany({
      where: { userId },
      include: {
        files: {
          include: {
            file: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 处理返回数据
    const processedShares = shares.map(share => ({
      id: share.id,
      shareCode: share.shareCode,
      extractCode: share.extractCode,
      expiresAt: share.expiresAt,
      accessLimit: share.accessLimit,
      accessCount: share.accessCount,
      createdAt: share.createdAt,
      files: share.files.map(fileLink => ({
        id: fileLink.file.id,
        name: fileLink.file.name,
        size: fileLink.file.size,
        type: fileLink.file.type,
        isFolder: fileLink.file.isFolder
      }))
    }));

    return NextResponse.json({
      success: true,
      data: processedShares
    });
  } catch (error) {
    console.error('获取分享列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取分享列表失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * 删除分享
 * DELETE /api/storage/share
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    // 获取请求数据
    const data = await request.json();
    const { shareIds } = data;

    // 验证参数
    if (!shareIds || !Array.isArray(shareIds) || shareIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要删除的分享' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 删除分享记录
    const result = await db.fileShare.deleteMany({
      where: {
        id: { in: shareIds },
        userId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count
      }
    });
  } catch (error) {
    console.error('删除分享失败:', error);
    return NextResponse.json(
      { success: false, error: '删除分享失败，请重试' },
      { status: 500 }
    );
  }
} 