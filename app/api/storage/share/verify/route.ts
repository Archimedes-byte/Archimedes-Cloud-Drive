import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/lib/database';
import crypto from 'crypto';

type FileWithRelations = {
  id: string;
  name: string;
  size: number | null;
  type: string | null;
  isFolder: boolean;
};

/**
 * 验证分享链接和提取码
 * POST /api/storage/share/verify
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求数据
    const data = await request.json();
    const { shareCode, extractCode } = data;
    
    console.log(`正在验证分享链接: ${shareCode}, 提取码长度: ${extractCode?.length || 0}`);

    // 验证参数
    if (!shareCode) {
      console.log('验证失败: 分享码为空');
      return NextResponse.json(
        { success: false, error: '分享码不能为空' },
        { status: 400 }
      );
    }

    // 先查询分享记录，不检查提取码
    const share = await db.fileShare.findFirst({
      where: {
        shareCode,
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    // 分享不存在
    if (!share) {
      console.log(`验证失败: 找不到分享记录 ${shareCode}`);
      return NextResponse.json(
        { success: false, error: '分享链接不存在' },
        { status: 404 }
      );
    }
    
    console.log(`找到分享记录: ID=${share.id}, 访问限制=${share.accessLimit || '无限制'}, 当前访问次数=${share.accessCount}`);

    // 检查是否需要验证提取码
    const needVerifyCode = share.extractCode && !share.autoFillCode;
    console.log(`是否需要验证提取码: ${needVerifyCode}, autoFillCode=${share.autoFillCode}`);
    
    if (needVerifyCode) {
      // 如果需要提取码但未提供
      if (!extractCode) {
        console.log('验证失败: 需要提取码但未提供');
        return NextResponse.json(
          { success: false, error: '请提供提取码' },
          { status: 400 }
        );
      }
      
      // 验证提取码
      if (extractCode !== share.extractCode) {
        console.log(`验证失败: 提取码错误，提供: ${extractCode}, 期望: ${share.extractCode}`);
        return NextResponse.json(
          { success: false, error: '提取码错误' },
          { status: 403 }
        );
      }
      
      console.log('提取码验证成功');
    } else {
      console.log('无需提取码或已设置自动填充');
    }

    // 检查是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      console.log(`验证失败: 分享已过期，过期时间: ${share.expiresAt}`);
      return NextResponse.json(
        { success: false, error: '分享链接已过期' },
        { status: 403 }
      );
    }

    // 获取访问者标识信息
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 计算访问者指纹
    const visitorData = `${clientIp}-${userAgent}`;
    const visitorFingerprint = crypto
      .createHash('md5')
      .update(visitorData)
      .digest('hex');
    
    console.log(`访问者指纹: ${visitorFingerprint.substring(0, 8)}...`);
    
    // 检查此访问者是否已访问过
    const existingVisitor = await db.fileShareVisitor.findUnique({
      where: {
        shareId_fingerprint: {
          shareId: share.id,
          fingerprint: visitorFingerprint
        }
      }
    });
    
    let visitorIsNew = !existingVisitor;
    
    if (visitorIsNew) {
      console.log('这是新访问者的首次访问');
      
      // 如果是新访问者且有访问次数限制，检查是否已达上限
      if (share.accessLimit !== null && share.accessCount >= share.accessLimit) {
        console.log(`验证失败: 访问次数已达上限 ${share.accessCount}/${share.accessLimit}`);
        return NextResponse.json(
          { success: false, error: '分享链接已达到访问次数上限' },
          { status: 403 }
        );
      }
      
      try {
        // 为新访问者创建记录
        await db.fileShareVisitor.create({
          data: {
            shareId: share.id,
            fingerprint: visitorFingerprint,
            ipAddress: clientIp,
            userAgent: userAgent.substring(0, 255), // 防止过长
            visitCount: 1,
            firstVisitAt: new Date(),
            lastVisitAt: new Date()
          }
        });
        
        // 增加分享的访问计数
        await db.fileShare.update({
          where: { id: share.id },
          data: {
            accessCount: {
              increment: 1
            }
          }
        });
        
        console.log(`已增加访问计数: ${share.accessCount} -> ${share.accessCount + 1}`);
      } catch (error) {
        // 处理可能的唯一约束冲突（在高并发情况下可能发生）
        console.error('创建访问记录时出错:', error);
        // 继续处理，不阻止用户访问
      }
    } else {
      try {
        // 已知访问者，更新访问次数
        await db.fileShareVisitor.update({
          where: { id: existingVisitor.id },
          data: {
            visitCount: {
              increment: 1
            },
            lastVisitAt: new Date()
          }
        });
        
        console.log(`已知访问者再次访问，更新访问记录，ID: ${existingVisitor.id}`);
      } catch (error) {
        console.error('更新访问记录时出错:', error);
        // 继续处理，不阻止用户访问
      }
    }
    
    // 获取更新后的访问计数
    const updatedShare = await db.fileShare.findUnique({
      where: { id: share.id },
      select: { accessCount: true }
    });
    
    // 处理返回数据
    const shareInfo = {
      expiresAt: share.expiresAt,
      accessLimit: share.accessLimit,
      accessCount: updatedShare?.accessCount || share.accessCount, // 使用最新的访问计数
      files: share.files.map(fileLink => ({
        id: fileLink.file.id,
        name: fileLink.file.name,
        size: fileLink.file.size || 0,
        type: fileLink.file.type || 'unknown',
        isFolder: fileLink.file.isFolder || false
      }))
    };

    console.log('验证成功，返回分享信息');
    
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