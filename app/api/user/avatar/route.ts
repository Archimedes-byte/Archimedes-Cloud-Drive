import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import fs from 'fs';

// 确保上传目录存在
const ensureUploadDir = async () => {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    console.log('创建头像上传目录:', uploadDir);
    await mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 获取用户当前头像文件路径
const getUserAvatarPath = async (userId: string) => {
  const user = await prisma.userProfile.findUnique({
    where: { userId },
    select: { avatarUrl: true }
  });
  
  if (!user?.avatarUrl) return null;
  
  // 从URL提取文件�?
  const fileName = user.avatarUrl.split('/').pop();
  if (!fileName) return null;
  
  return join(process.cwd(), 'public', 'uploads', 'avatars', fileName);
};

// 获取用户当前头像
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访�? },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存�? },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: user.profile?.avatarUrl || session.user.image || null
    });
  } catch (error) {
    console.error('获取头像失败:', error);
    return NextResponse.json(
      { success: false, error: '获取头像失败' },
      { status: 500 }
    );
  }
}

// 上传用户头像
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访�? },
        { status: 401 }
      );
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存�? },
        { status: 404 }
      );
    }

    // 处理表单数据
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供头像文�? },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型，请上传JPEG、PNG、GIF或WEBP图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（最�?MB�?
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '文件大小超过限制（最�?MB�? },
        { status: 400 }
      );
    }

    // 生成唯一文件�?
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    // 确保上传目录存在
    const uploadDir = await ensureUploadDir();
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/avatars/${fileName}`;

    console.log('准备写入文件:', filePath);
    console.log('对应的URL:', fileUrl);

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 删除旧头像文�?
    try {
      const oldAvatarPath = await getUserAvatarPath(user.id);
      if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
        console.log('删除旧头像文�?', oldAvatarPath);
        await unlink(oldAvatarPath);
      }
    } catch (deleteError) {
      console.error('删除旧头像文件失�?', deleteError);
      // 继续执行，不中断上传流程
    }
    
    // 写入文件
    try {
      await writeFile(filePath, buffer);
      console.log('文件写入成功:', filePath);
    } catch (writeError) {
      console.error('文件写入失败:', writeError);
      return NextResponse.json(
        { success: false, error: '文件保存失败，请重试' },
        { status: 500 }
      );
    }

    // 更新用户资料
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { avatarUrl: fileUrl },
      create: {
        userId: user.id,
        avatarUrl: fileUrl,
        displayName: session.user.name || ''
      }
    });

    return NextResponse.json({ 
      success: true,
      avatarUrl: fileUrl
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    return NextResponse.json(
      { success: false, error: '头像上传失败' },
      { status: 500 }
    );
  }
}

// 删除自定义头像，恢复默认头像
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访�? },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存�? },
        { status: 404 }
      );
    }
    
    // 删除头像文件
    try {
      const avatarPath = await getUserAvatarPath(user.id);
      if (avatarPath && fs.existsSync(avatarPath)) {
        console.log('删除头像文件:', avatarPath);
        await unlink(avatarPath);
      }
    } catch (deleteError) {
      console.error('删除头像文件失败:', deleteError);
      // 继续执行，不中断删除流程
    }

    // 更新用户资料，删除自定义头像
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { avatarUrl: null }
    });

    return NextResponse.json({
      success: true,
      avatarUrl: session.user.image || null
    });
  } catch (error) {
    console.error('删除头像失败:', error);
    return NextResponse.json(
      { success: false, error: '删除头像失败' },
      { status: 500 }
    );
  }
} 
