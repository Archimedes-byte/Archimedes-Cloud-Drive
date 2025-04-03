import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// 获取当前认证配置
import { authOptions } from '@/lib/auth'

// 获取用户资料
export async function GET() {
  console.log('GET /api/user/profile 请求开始')
  try {
    const session = await getServerSession(authOptions)
    console.log('获取到用户会话:', session ? '成功' : '失败')
    
    if (!session?.user?.email) {
      console.log('未授权访问: 没有找到用户邮箱')
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    console.log('查询用户信息，邮箱:', session.user.email)
    // 查询用户及其个人资料
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      include: {
        profile: true
      }
    })

    if (!user) {
      console.log('用户不存在:', session.user.email)
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 构建完整的用户信息响应
    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      displayName: user.profile?.displayName || user.name || '',
      bio: user.profile?.bio || '',
      location: user.profile?.location || '',
      website: user.profile?.website || '',
      company: user.profile?.company || '',
      avatarUrl: user.profile?.avatarUrl || user.image || null,
      theme: user.profile?.theme || null,
      createdAt: user.createdAt.toISOString()
    }

    console.log('成功获取用户信息:', user.id)
    console.log('用户创建时间:', user.createdAt, ' -> 格式化后:', userProfile.createdAt)
    return NextResponse.json({
      success: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  console.log('PUT /api/user/profile 请求开始')
  try {
    const session = await getServerSession(authOptions)
    console.log('获取到用户会话:', session ? '成功' : '失败')
    
    if (!session?.user?.email) {
      console.log('未授权访问: 没有找到用户邮箱')
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await request.json()
    console.log('接收到的数据:', data)

    // 先获取用户ID
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 使用upsert确保不管资料是否存在都能正常创建或更新
    const updatedProfile = await prisma.userProfile.upsert({
      where: {
        userId: user.id
      },
      create: {
        userId: user.id,
        displayName: data.displayName || session.user.name || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        company: data.company || '',
        avatarUrl: data.avatarUrl || null,
        theme: data.theme || null
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        location: data.location,
        website: data.website,
        company: data.company,
        avatarUrl: data.avatarUrl,
        theme: data.theme
      }
    })

    // 同时更新用户名称
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: data.displayName || null
      }
    })

    // 获取更新后的完整用户信息
    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      include: {
        profile: true
      }
    })

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: '获取更新后的用户信息失败' },
        { status: 500 }
      )
    }

    // 构建完整的用户信息响应
    const userProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image,
      displayName: updatedUser.profile?.displayName || updatedUser.name || '',
      bio: updatedUser.profile?.bio || '',
      location: updatedUser.profile?.location || '',
      website: updatedUser.profile?.website || '',
      company: updatedUser.profile?.company || '',
      avatarUrl: updatedUser.profile?.avatarUrl || updatedUser.image || null,
      theme: updatedUser.profile?.theme || null,
      createdAt: updatedUser.createdAt.toISOString()
    }

    console.log('成功更新用户信息:', user.id)
    console.log('用户创建时间:', updatedUser.createdAt, ' -> 格式化后:', userProfile.createdAt)
    return NextResponse.json({
      success: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { success: false, error: '更新用户信息失败' },
      { status: 500 }
    )
  }
} 