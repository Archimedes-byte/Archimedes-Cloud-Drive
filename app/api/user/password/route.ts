import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/lib/database'
import { hash } from 'bcrypt'

// 获取当前认证配置
import { authOptions } from '@/app/lib/auth/auth'
import { createSuccessResponse, createErrorResponse, logAuthError } from '@/app/lib/error/auth-error'
import { validatePasswordStrength } from '@/app/utils/validation/auth-validation'

/**
 * 更新用户密码
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前会话
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return createErrorResponse('未登录', 401)
    }
    
    const { id: userId } = session.user
    
    // 获取请求数据
    const data = await request.json()
    
    // 验证密码是否为空
    if (!data.password) {
      return createErrorResponse('密码不能为空', 400)
    }
    
    // 使用统一的密码验证函数
    const passwordErrors = validatePasswordStrength(data.password)
    if (passwordErrors.length > 0) {
      // 返回第一个错误作为响应
      return createErrorResponse(passwordErrors[0], 400)
    }
    
    // 加密密码
    const hashedPassword = await hash(data.password, 10)
    
    // 更新用户密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
    
    return createSuccessResponse(null, '密码更新成功')
  } catch (error) {
    logAuthError(error, 'update-password')
    return createErrorResponse('密码更新失败', 500)
  }
} 
