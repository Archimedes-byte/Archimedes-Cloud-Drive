import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/database';
import { authOptions } from '@/app/lib/auth';

// 移除模拟数据，使用真实数据库

/**
 * 创建分享
 * POST /api/storage/share
 */
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理分享创建请求');
    
    // 解析请求体
    const body = await request.json();
    const { fileIds, expiryDays, extractCode, accessLimit, autoRefreshCode } = body;
    
    console.log('分享请求参数:', JSON.stringify({
      fileIds,
      expiryDays,
      hasExtractCode: !!extractCode,
      accessLimit,
      autoRefreshCode
    }));

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      console.error('请求参数错误: 文件ID无效');
      return NextResponse.json({ error: '请提供要分享的文件ID' }, { status: 400 });
    }

    // 获取当前用户会话 - 使用 authOptions 确保正确获取会话
    const session = await getServerSession(authOptions);
    console.log('用户会话:', JSON.stringify({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id || 'undefined',
      userEmail: session?.user?.email || 'unknown'
    }));
    
    if (!session || !session.user || !session.user.id) {
      console.error('未授权: 用户未登录或会话无效');
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
    }

    const userId = session.user.id;
    if (!userId) {
      console.error('用户ID无效');
      return NextResponse.json({ error: '用户身份无效，请重新登录' }, { status: 401 });
    }
    
    console.log(`用户ID: ${userId}, 正在验证文件权限`);

    // 验证文件归属权
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: userId
      }
    });
    
    console.log(`找到符合条件的文件数量: ${files.length}/${fileIds.length}`);

    if (files.length !== fileIds.length) {
      console.error('部分文件不存在或没有权限', {
        requested: fileIds,
        found: files.map(f => f.id)
      });
      return NextResponse.json({ error: '部分文件不存在或您没有权限' }, { status: 403 });
    }

    // 生成随机分享码
    const shareCode = generateRandomCode(8);
    
    // 生成提取码（如果没有提供）
    const finalExtractCode = extractCode || generateRandomCode(4, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    
    // 计算过期时间
    const expiresAt = expiryDays === -1 
      ? null 
      : new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    console.log('准备创建分享记录', {
      shareCode,
      extractCode: finalExtractCode,
      expiresAt: expiresAt ? expiresAt.toISOString() : 'never',
      fileCount: fileIds.length,
      userId
    });

    // 创建分享记录
    try {
      // 使用正确的用户关联
      const share = await prisma.fileShare.create({
        data: {
          shareCode,
          extractCode: finalExtractCode,
          expiresAt,
          accessLimit,
          userId,
          autoFillCode: autoRefreshCode || false,
          files: {
            create: fileIds.map(fileId => ({
              fileId
            }))
          }
        }
      });
      
      console.log('分享记录创建成功', { shareId: share.id });
      
      // 构建分享链接
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || '';
      const shareLink = `${baseUrl}/s/${shareCode}`;
      
      // 如果设置了自动填充提取码，则直接附加到链接
      const shareLinkWithCode = autoRefreshCode ? `${shareLink}?code=${finalExtractCode}` : shareLink;

      console.log('分享链接生成成功', { 
        shareLink: shareLinkWithCode.replace(finalExtractCode, '******')
      });

      return NextResponse.json({
        shareLink: shareLinkWithCode,
        extractCode: finalExtractCode
      });
    } catch (dbError) {
      console.error('数据库操作失败', dbError);
      return NextResponse.json(
        { error: '创建分享记录失败', details: (dbError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('创建分享时出错:', error);
    return NextResponse.json(
      { error: '创建分享失败', details: (error as Error).message },
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
    // 获取当前用户会话
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // 从数据库获取用户的分享列表
    const shares = await prisma.fileShare.findMany({
      where: {
        userId
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 处理返回数据，格式化为前端需要的结构
    const formattedShares = shares.map(share => {
      // 获取第一个文件作为列表显示用
      const firstFile = share.files[0]?.file;
      
      return {
        id: share.id,
        fileId: firstFile?.id || '',
        fileName: firstFile?.name || '未知文件',
        shareLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/s/${share.shareCode}`,
        extractCode: share.extractCode,
        expiryDays: share.expiresAt 
          ? Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) 
          : -1,
        accessLimit: share.accessLimit,
        createdAt: share.createdAt.toISOString(),
        accessCount: share.accessCount || 0
      };
    });

    return NextResponse.json({ shares: formattedShares });
  } catch (error) {
    console.error('获取分享列表时出错:', error);
    return NextResponse.json(
      { error: '获取分享列表失败', details: (error as Error).message },
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
    // 获取当前用户会话
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // 解析请求体
    const body = await request.json();
    const { shareIds } = body;

    if (!shareIds || !Array.isArray(shareIds) || shareIds.length === 0) {
      return NextResponse.json({ error: '请提供要删除的分享ID' }, { status: 400 });
    }

    // 删除分享相关的文件记录
    await prisma.fileShareFile.deleteMany({
      where: {
        shareId: { in: shareIds }
      }
    });

    // 删除分享记录
    const result = await prisma.fileShare.deleteMany({
      where: {
        id: { in: shareIds },
        userId
      }
    });

    return NextResponse.json({ deletedCount: result.count });
  } catch (error) {
    console.error('删除分享时出错:', error);
    return NextResponse.json(
      { error: '删除分享失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 生成随机编码
 */
function generateRandomCode(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  const charactersLength = charset.length;
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
} 