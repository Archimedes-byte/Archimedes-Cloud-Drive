import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/database'
import bcrypt from 'bcrypt'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth'

// 更新用户密码
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await request.json()

    if (!data.password) {
      return NextResponse.json(
        { success: false, error: '密码不能为空' },
        { status: 400 }
      )
    }

    if (data.password.length < 8) {
      return NextResponse.json(
        { success: false, error: '密码长度至少为8个字符' },
        { status: 400 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 更新用户密码
    await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json({
      success: true,
      message: '密码设置成功'
    })
  } catch (error) {
    console.error('设置密码失败:', error)
    return NextResponse.json(
      { success: false, error: '设置密码失败' },
      { status: 500 }
    )
  }
} 
