import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface UserInfo {
  displayName: string
  bio: string
  location: string
  website: string
  company: string
}

export function useProfile() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    company: ''
  })

  const fetchUserProfile = async () => {
    if (status === 'loading' || !session?.user) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 从session设置基本用户信息
      setUserInfo(prev => ({
        ...prev,
        displayName: session.user?.name || '',
      }))

      console.log('Fetching user profile from API')
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || '获取用户信息失败')
        }

        if (data.success && data.user) {
          setUserInfo(prev => ({
            ...prev,
            ...data.user,
            displayName: data.user.name || prev.displayName,
          }))
        }
      } catch (apiError) {
        console.error('API fetch error:', apiError)
        console.warn('继续使用会话中的基本用户信息')
      }
    } catch (err) {
      console.error('初始化用户信息失败:', err)
      setError(err instanceof Error ? err.message : '加载用户信息失败')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updatedInfo: UserInfo) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInfo),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存失败')
      }

      if (data.success) {
        setUserInfo(prev => ({
          ...prev,
          ...data.user,
          displayName: data.user.name || prev.displayName,
        }))
        return true
      } else {
        throw new Error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      setError(error instanceof Error ? error.message : '保存失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [session, status])

  return {
    userInfo,
    setUserInfo,
    isLoading,
    error,
    updateProfile
  }
} 