import { useState } from 'react'

export function usePassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordInfo, setPasswordInfo] = useState({
    password: '',
    confirmPassword: ''
  })

  const validatePassword = () => {
    if (!passwordInfo.password) {
      setPasswordError('请输入密码')
      return false
    }
    
    if (passwordInfo.password.length < 8) {
      setPasswordError('密码长度至少为8个字符')
      return false
    }

    if (passwordInfo.password !== passwordInfo.confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return false
    }

    return true
  }

  const handlePasswordChange = (field: 'password' | 'confirmPassword', value: string) => {
    setPasswordInfo(prev => ({...prev, [field]: value}))
    setPasswordError(null)
  }

  const updatePassword = async () => {
    if (!validatePassword()) {
      return false
    }

    try {
      setIsLoading(true)
      setPasswordError(null)
      setPasswordSuccess(null)

      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordInfo.password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '密码设置失败')
      }

      setPasswordSuccess('密码设置成功！您现在可以使用邮箱和密码登录')
      setPasswordInfo({ password: '', confirmPassword: '' })
      return true
    } catch (error) {
      console.error('密码设置失败:', error)
      setPasswordError(error instanceof Error ? error.message : '密码设置失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetPasswordState = () => {
    setPasswordInfo({ password: '', confirmPassword: '' })
    setPasswordError(null)
    setPasswordSuccess(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return {
    passwordInfo,
    passwordError,
    passwordSuccess,
    isLoading,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handlePasswordChange,
    updatePassword,
    resetPasswordState
  }
} 