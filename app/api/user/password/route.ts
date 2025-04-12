import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/database'
import bcrypt from 'bcrypt'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth'

// 更新用户密码
export async function PUT(request: NextRequest) {
  console.log('PUT /api/user/password 请求开始')
  try {
    const session = await getServerSession(authOptions)
    console.log('获取到用户会话', session ? '成功' : '失败')
    
    if (!session?.user?.email) {
      console.log('未授权访问，没有找到用户邮箱')
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await request.json()
    console.log('接收到密码更新请求')

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
    console.log('密码加密完成')

    // 更新用户密码
    await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        password: hashedPassword
      }
    })

    console.log('用户密码更新成功:', session.user.email)
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
