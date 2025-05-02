import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from 'sonner'
import { applyTheme as applyThemeService } from '@/app/theme';
import { createCancelableDebounce } from '@/app/utils/function/debounce';

/**
 * 用户资料接口
 */
export interface UserProfile {
  /** 用户ID */
  id: string
  /** 邮箱 */
  email: string
  /** 用户名 */
  name: string | null
  /** 头像URL */
  avatarUrl?: string | null
  /** 主题 */
  theme?: string | null
  /** 已使用存储空间（字节） */
  storageUsed: number
  /** 存储空间限制（字节） */
  storageLimit: number
  /** 用户简介 */
  bio?: string
  /** 位置 */
  location?: string
  /** 网站 */
  website?: string
  /** 公司 */
  company?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 用户资料更新输入
 */
export interface UserProfileInput {
  /** 显示名称 */
  name?: string
  /** 头像URL */
  avatarUrl?: string
  /** 主题 */
  theme?: string
  /** 用户简介 */
  bio?: string
  /** 位置 */
  location?: string
  /** 网站 */
  website?: string
  /** 公司 */
  company?: string
}

/**
 * 用户资料API响应
 */
export interface UserProfileResponse {
  /** 是否成功 */
  success: boolean
  /** 用户资料 */
  profile?: UserProfile
  /** 错误信息 */
  error?: string
}

// 默认离线用户配置，当API不可用时使用
const DEFAULT_OFFLINE_PROFILE: UserProfile = {
  id: 'offline-user',
  email: 'offline@example.com',
  name: '离线模式',
  avatarUrl: null,
  theme: 'default',
  storageUsed: 0,
  storageLimit: 1024 * 1024 * 100, // 100MB
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 重试配置
const RETRY_DELAY = 3000 // 3秒
const MAX_RETRIES = 3 // 修改为3次重试 (原来是2次)
const MAX_ERROR_COUNT = 3 // 连续错误阈值，超过后进入离线模式

/**
 * 用户资料Hook
 * 提供用户资料的获取、更新和管理功能
 * 
 * @returns 用户资料和相关操作方法
 */
export function useProfile() {
  const { data: session } = useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const sessionChangeRef = useRef<number>(0)

  // 有效的头像URL，优先使用用户资料中的，其次是会话中的
  const effectiveAvatarUrl = userProfile?.avatarUrl || session?.user?.image || null

  /**
   * 获取用户资料
   * @param showToast 是否显示加载成功的提示
   * @param retryCount 重试次数
   * @returns 用户资料
   */
  const fetchUserProfile = useCallback(async (showToast = false, retryCount = 0) => {
    // 判断是否在短时间内重复调用，避免频繁请求
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    
    if (retryCount === 0 && timeSinceLastFetch < 2000 && lastFetchTimeRef.current > 0) {
      console.log(`距上次请求仅 ${timeSinceLastFetch}ms，跳过此次请求`)
      return userProfile
    }
    
    lastFetchTimeRef.current = now

    // 添加更详细的 session 检查日志
    console.log('获取用户资料检查 session 状态:', { 
      sessionExists: !!session, 
      hasUser: !!session?.user, 
      userEmail: session?.user?.email || 'unknown',
      retryCount 
    })

    // 会话检查 - 增加容错处理
    if (!session) {
      console.log('未检测到有效会话，等待会话初始化后再试...')
      
      // 如果还有重试次数，延迟后重试
      if (retryCount < MAX_RETRIES) {
        console.log(`${RETRY_DELAY * 2}ms后尝试重新获取会话...`)
        setTimeout(() => {
          fetchUserProfile(showToast, retryCount + 1)
        }, RETRY_DELAY * 2)
        return null
      }
      
      setIsLoading(false)
      setError('未检测到有效会话')
      return null
    }
    
    // 确保会话中有用户信息
    if (!session.user || !session.user.email) {
      console.log('会话中没有有效的用户信息，无法获取用户资料')
      
      // 如果还有重试次数，延迟后重试
      if (retryCount < MAX_RETRIES) {
        console.log(`${RETRY_DELAY * 2}ms后重试获取用户信息...`)
        setTimeout(() => {
          fetchUserProfile(showToast, retryCount + 1)
        }, RETRY_DELAY * 2)
        return null
      }
      
      setIsLoading(false)
      setError('会话中无有效用户信息')
      return null
    }

    // 如果已经超过最大错误数，并且已经进入离线模式，则使用离线配置
    if (isOfflineMode && retryCount === 0) {
      console.log('应用正在离线模式下运行，使用默认配置')
      if (!userProfile) {
        const offlineProfile = {
          ...DEFAULT_OFFLINE_PROFILE,
          email: session.user?.email || DEFAULT_OFFLINE_PROFILE.email,
          name: session.user?.name || DEFAULT_OFFLINE_PROFILE.name,
        }
        setUserProfile(offlineProfile)
        setIsLoading(false)
        return offlineProfile
      }
      setIsLoading(false)
      return userProfile
    }

    // 如果已经有用户资料且不是重试模式，则直接返回现有资料
    if (userProfile && !showToast && retryCount === 0) {
      console.log('已有用户资料，直接返回:', userProfile.email)
      return userProfile
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current
    
    let timeoutId: NodeJS.Timeout | null = null

    try {
      setIsLoading(true)
      
      if (retryCount === 0) {
        setError(null)
      }
      
      console.log(`获取用户资料${retryCount > 0 ? `(重试 ${retryCount}/${MAX_RETRIES})` : ''}...`)
      
      // 设置请求超时 - 15秒，增强容错性 (原来是10秒)
      timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          console.log('用户资料请求超时，中止请求')
          abortControllerRef.current.abort()
        }
      }, 15000) // 15秒超时
      
      const response = await fetch('/api/user/profile', {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (timeoutId) clearTimeout(timeoutId)
      
      // 添加更详细的响应日志
      console.log('资料请求响应状态:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        console.error(`资料请求失败, 状态码: ${response.status}`)
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`)
      }
      
      const data: UserProfileResponse = await response.json()
      
      console.log('资料请求返回数据:', {
        success: data.success,
        hasProfile: !!data.profile,
        error: data.error || '无'
      })
      
      if (!data.success) {
        console.error('资料请求返回失败状态:', data.error)
        throw new Error(data.error || '获取用户资料失败')
      }
      
      if (!data.profile) {
        console.error('资料请求未返回用户数据')
        throw new Error('服务器未返回用户资料数据')
      }
      
      // 请求成功，重置连续错误计数
      setConsecutiveErrors(0)
      setIsOfflineMode(false)
      setUserProfile(data.profile)
      // 明确设置加载状态为完成
      setIsLoading(false)
      console.log('用户资料获取成功:', data.profile.email)
      
      if (showToast) {
        toast.success('用户资料已更新')
      }
      
      return data.profile
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId)
      
      console.error('获取用户资料失败:', err)
      setError(err instanceof Error ? err.message : '无法加载用户资料')
      
      // 增加连续错误计数
      setConsecutiveErrors(prev => {
        const newCount = prev + 1
        console.log(`连续错误计数: ${prev} -> ${newCount}`)
        
        // 如果超过阈值，进入离线模式
        if (newCount >= MAX_ERROR_COUNT) {
          setIsOfflineMode(true)
          console.log(`错误次数(${newCount})超过阈值(${MAX_ERROR_COUNT})，进入离线模式`)
          
          // 准备离线用户资料
          const offlineProfile = {
            ...DEFAULT_OFFLINE_PROFILE,
            email: session?.user?.email || DEFAULT_OFFLINE_PROFILE.email,
            name: session?.user?.name || DEFAULT_OFFLINE_PROFILE.name,
          }
          
          setUserProfile(offlineProfile)
        }
        
        return newCount
      })
      
      // 在重试次数内进行重试，增加递增的延迟时间
      if (retryCount < MAX_RETRIES) {
        const nextRetryDelay = RETRY_DELAY * (retryCount + 1) // 递增延迟
        console.log(`${nextRetryDelay}ms后进行第${retryCount + 1}次重试...`)
        setTimeout(() => {
          fetchUserProfile(showToast, retryCount + 1)
        }, nextRetryDelay)
      } else {
        setIsLoading(false)
      }
      
      return userProfile
    }
  }, [session, userProfile, isOfflineMode, consecutiveErrors])

  // 监听会话变更，获取用户资料
  useEffect(() => {
    // 会话变更次数加1
    sessionChangeRef.current += 1
    const currentSessionChange = sessionChangeRef.current
    
    console.log(`会话变化(${currentSessionChange})，重新获取用户资料`)
    
    // 重置离线模式和错误计数
    if (session?.user) {
      setIsOfflineMode(false)
      setConsecutiveErrors(0)
    }
    
    // 创建可取消的防抖函数
    const { debouncedFn, cancel } = createCancelableDebounce(() => {
      // 确保在会话状态未变更的情况下执行
      if (sessionChangeRef.current === currentSessionChange) {
        fetchUserProfile()
      }
    }, 100);
    
    // 延迟获取用户资料，避免在会话初始化过程中频繁请求
    debouncedFn();
    
    return () => cancel();
  }, [session, fetchUserProfile])

  /**
   * 强制刷新用户资料
   */
  const forceRefreshProfile = useCallback(() => {
    return fetchUserProfile(true)
  }, [fetchUserProfile])

  /**
   * 更新用户资料
   * @param profileData 更新的资料数据
   * @returns 是否更新成功
   */
  const updateUserProfile = useCallback(async (profileData: UserProfileInput) => {
    if (!session?.user) {
      console.error('用户未登录，无法更新资料')
      return false
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })
      
      const data: UserProfileResponse = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新资料失败')
      }
      
      if (data.profile) {
        setUserProfile(data.profile)
        toast.success('资料更新成功')
        return true
      } else {
        throw new Error('服务器返回的数据无效')
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      setError(error instanceof Error ? error.message : '更新资料失败')
      toast.error(error instanceof Error ? error.message : '更新资料失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [session])

  /**
   * 更新用户主题
   * @param theme 主题ID
   * @returns 是否更新成功
   */
  const updateTheme = useCallback(async (theme: string) => {
    return updateUserProfile({ theme })
  }, [updateUserProfile])

  /**
   * 应用主题
   * @param theme 主题ID
   */
  const applyTheme = useCallback((theme: string = 'default') => {
    try {
      applyThemeService(theme)
      return true
    } catch (error) {
      console.error('应用主题失败:', error)
      return false
    }
  }, [])

  return {
    userProfile,
    isLoading,
    error,
    isOfflineMode,
    effectiveAvatarUrl,
    fetchUserProfile,
    forceRefreshProfile,
    updateUserProfile,
    updateTheme,
    applyTheme
  }
} 