import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/database'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth'

// 从前端获取的用户资料接口
interface UserProfileInput {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  company?: string
  avatarUrl?: string
  theme?: string
}

// 返回给前端的用户资料接口
interface UserProfileResponse {
  id: string
  email: string
  name: string | null
  avatarUrl?: string | null
  theme?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  company?: string | null
  storageUsed: number
  storageLimit: number
  createdAt: string
  updatedAt: string
}

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
    // 查询用户，并包含用户资料
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

    // 构建用户资料响应
    const userProfile: UserProfileResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.profile?.avatarUrl || null, 
      theme: user.profile?.theme || null,
      bio: user.profile?.bio || null,
      location: user.profile?.location || null,
      website: user.profile?.website || null,
      company: user.profile?.company || null,
      storageUsed: user.storageUsed,
      storageLimit: user.storageLimit,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }

    console.log('成功获取用户信息:', user.id)
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

    const data = await request.json() as UserProfileInput
    console.log('接收到的数据:', data)

    // 获取用户
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      include: {
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 更新用户名称
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: data.displayName || user.name
      }
    })

    // 更新或创建用户资料
    console.log('开始更新用户资料，用户ID:', user.id);
    console.log('当前用户Profile数据:', user.profile || '无');
    
    const profile = await prisma.userProfile.upsert({
      where: {
        userId: user.id
      },
      update: {
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.profile?.avatarUrl,
        theme: data.theme !== undefined ? data.theme : user.profile?.theme,
        displayName: data.displayName || user.profile?.displayName || user.name,
        bio: data.bio !== undefined ? data.bio : user.profile?.bio,
        location: data.location !== undefined ? data.location : user.profile?.location,
        website: data.website !== undefined ? data.website : user.profile?.website,
        company: data.company !== undefined ? data.company : user.profile?.company
      },
      create: {
        userId: user.id,
        displayName: data.displayName || user.name || '',
        avatarUrl: data.avatarUrl,
        theme: data.theme,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        company: data.company || ''
      }
    });
    
    console.log('用户资料更新/创建成功:', profile);

    // 构建用户资料响应
    const userProfile: UserProfileResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: profile.avatarUrl,
      theme: profile.theme,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      company: profile.company,
      storageUsed: updatedUser.storageUsed,
      storageLimit: updatedUser.storageLimit,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    }

    console.log('成功更新用户信息:', user.id)
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