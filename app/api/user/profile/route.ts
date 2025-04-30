import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/database'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth'

// 从前端获取的用户资料接口
interface UserProfileInput {
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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }
    
    // 使用 try-catch 包装数据库操作
    try {
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
        return NextResponse.json(
          { success: false, error: '用户不存在，请先完成注册流程' },
          { status: 404 }
        )
      }

      // 检查用户资料是否存在
      if (!user.profile) {
        // 为用户创建默认资料
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            theme: 'default'
          }
        })
        
        // 重新获取包含资料的用户
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true }
        })
        
        if (!updatedUser || !updatedUser.profile) {
          throw new Error('创建资料后无法检索用户数据')
        }
        
        // 构建用户资料响应
        const userProfile: UserProfileResponse = {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          avatarUrl: updatedUser.profile.avatarUrl,
          theme: updatedUser.profile.theme,
          bio: updatedUser.profile.bio,
          location: updatedUser.profile.location,
          website: updatedUser.profile.website,
          company: updatedUser.profile.company,
          storageUsed: updatedUser.storageUsed,
          storageLimit: updatedUser.storageLimit,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString()
        }
        
        return NextResponse.json({
          success: true,
          profile: userProfile
        })
      }

      // 构建用户资料响应
      const userProfile: UserProfileResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.profile.avatarUrl,
        theme: user.profile.theme,
        bio: user.profile.bio,
        location: user.profile.location,
        website: user.profile.website,
        company: user.profile.company,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }

      return NextResponse.json({
        success: true,
        profile: userProfile
      })
    } catch (dbError) {
      console.error('数据库操作失败:', dbError)
      return NextResponse.json(
        { success: false, error: '数据库操作失败，请稍后重试' },
        { status: 500 }
      )
    }
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
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await request.json() as UserProfileInput

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
        name: user.name
      }
    })

    // 更新或创建用户资料
    const profile = await prisma.userProfile.upsert({
      where: {
        userId: user.id
      },
      update: {
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.profile?.avatarUrl,
        theme: data.theme !== undefined ? data.theme : user.profile?.theme,
        bio: data.bio !== undefined ? data.bio : user.profile?.bio,
        location: data.location !== undefined ? data.location : user.profile?.location,
        website: data.website !== undefined ? data.website : user.profile?.website,
        company: data.company !== undefined ? data.company : user.profile?.company
      },
      create: {
        userId: user.id,
        avatarUrl: data.avatarUrl,
        theme: data.theme,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        company: data.company || ''
      }
    });

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