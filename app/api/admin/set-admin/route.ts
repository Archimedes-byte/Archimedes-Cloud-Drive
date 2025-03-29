import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAILS = ['archimedesbyte@gmail.com']; 

export async function POST(request: Request) {
  try {
    const { email, secretKey } = await request.json();

    // 验证密钥
    if (secretKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: '无效的密钥' }, { status: 403 });
    }

    // 验证邮箱
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: '该邮箱不在管理员列表中' }, { status: 403 });
    }

    // 更新用户为管理员
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    return NextResponse.json({
      message: '管理员设置成功',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('设置管理员失败:', error);
    return NextResponse.json(
      { error: '设置管理员失败' },
      { status: 500 }
    );
  }
} 