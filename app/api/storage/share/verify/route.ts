import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/lib/database';

/**
 * 验证分享链接和提取码
 * POST /api/storage/share/verify
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    const { shareCode, extractCode } = data;

    // 验证参数
    if (!shareCode || !extractCode) {
      return NextResponse.json(
        { success: false, error: '分享码或提取码不能为空' },
        { status: 400 }
      );
    }

    // 查询分享记录
    const share = await db.fileShare.findFirst({
      where: {
        shareCode,
        extractCode,
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 分享不存在或提取码错误
    if (!share) {
      return NextResponse.json(
        { success: false, error: '分享链接不存在或提取码错误' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: '分享链接已过期' },
        { status: 403 }
      );
    }

    // 检查访问次数限制，只有未达到限制时才允许访问
    if (share.accessLimit !== null && share.accessCount >= share.accessLimit) {
      return NextResponse.json(
        { success: false, error: '分享链接已达到访问次数上限' },
        { status: 403 }
      );
    }

    // 获取当前请求的IP地址
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
                    
    // 只增加一次访问计数，使用IP作为参考
    // 这样同一IP多次访问只计数一次
    await db.fileShare.update({
      where: { id: share.id },
      data: {
        accessCount: {
          increment: 1
        }
      }
    });

    // 处理返回数据
    const shareInfo = {
      expiresAt: share.expiresAt,
      accessLimit: share.accessLimit,
      accessCount: share.accessCount + 1, // 已更新的访问次数
      files: share.files.map(fileLink => ({
        id: fileLink.file.id,
        name: fileLink.file.name,
        size: fileLink.file.size || 0,
        type: fileLink.file.type || 'unknown',
        isFolder: fileLink.file.isFolder || false
      }))
    };

    return NextResponse.json({
      success: true,
      data: shareInfo
    });
  } catch (error) {
    console.error('验证分享链接失败:', error);
    return NextResponse.json(
      { success: false, error: '验证分享链接失败，请重试' },
      { status: 500 }
    );
  }
} 