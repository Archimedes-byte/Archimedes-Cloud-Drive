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
  name?: string
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
    console.log('Profile API: 开始处理请求')
    
    // 第一步：获取会话信息
    let session
    try {
      session = await getServerSession(authOptions)
      console.log('Profile API: 已获取会话信息', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        email: session?.user?.email || '无' 
      })
    } catch (sessionError) {
      console.error('Profile API: 会话获取错误:', sessionError)
      return NextResponse.json(
        { success: false, error: '无法获取认证会话信息' },
        { status: 401 }
      )
    }
    
    if (!session?.user?.email) {
      console.log('Profile API: 未授权访问 - 没有有效的用户会话')
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }
    
    // 第二步：查询用户数据
    try {
      console.log('Profile API: 开始查询用户数据:', session.user.email)
      
      // 测试数据库连接是否正常工作
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Profile API: 数据库连接正常')
      } catch (dbConnError) {
        console.error('Profile API: 数据库连接测试失败:', dbConnError)
        return NextResponse.json(
          { success: false, error: '数据库连接失败，请检查服务器状态' },
          { status: 503 }
        )
      }
      
      // 查询用户，并包含用户资料
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email
        },
        include: {
          profile: true
        }
      })

      console.log('Profile API: 用户查询结果:', { 
        found: !!user, 
        hasProfile: !!user?.profile,
        email: user?.email || '无' 
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: '用户不存在，请先完成注册流程' },
          { status: 404 }
        )
      }

      // 检查用户资料是否存在
      if (!user.profile) {
        console.log('Profile API: 用户资料不存在，创建默认资料')
        // 为用户创建默认资料
        try {
          await prisma.userProfile.create({
            data: {
              userId: user.id,
              theme: 'default'
            }
          })
          
          console.log('Profile API: 默认资料创建成功')
          
          // 重新获取包含资料的用户
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { profile: true }
          })
          
          if (!updatedUser || !updatedUser.profile) {
            console.error('Profile API: 创建资料后无法检索用户数据')
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
          
          console.log('Profile API: 成功返回包含新创建资料的用户数据')
          return NextResponse.json({
            success: true,
            profile: userProfile
          })
        } catch (createProfileError) {
          console.error('Profile API: 创建默认资料失败:', createProfileError)
          throw new Error(`创建用户资料失败: ${createProfileError.message || '未知错误'}`)
        }
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

      console.log('Profile API: 成功返回用户资料数据')
      return NextResponse.json({
        success: true,
        profile: userProfile
      })
    } catch (dbError) {
      console.error('Profile API: 数据库操作失败:', dbError)
      return NextResponse.json(
        { success: false, error: `数据库操作失败: ${dbError.message || '未知错误'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Profile API: 获取用户信息失败:', error)
    return NextResponse.json(
      { success: false, error: `获取用户信息失败: ${error.message || '未知错误'}` },
      { status: 500 }
    )
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    console.log('Profile API: 开始处理更新请求')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('Profile API: 更新资料未授权')
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await request.json() as UserProfileInput
    console.log('Profile API: 更新数据内容:', data)

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
      console.log('Profile API: 更新资料 - 用户不存在')
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 更新用户名称 (如果提供了name字段)
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: data.name !== undefined ? data.name : user.name
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

    console.log('Profile API: 资料更新成功')
    return NextResponse.json({
      success: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('Profile API: 更新用户信息失败:', error)
    return NextResponse.json(
      { success: false, error: `更新用户信息失败: ${error.message || '未知错误'}` },
      { status: 500 }
    )
  }
} 