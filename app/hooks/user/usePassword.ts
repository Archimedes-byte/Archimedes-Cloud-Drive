import { useState } from 'react'
import { AUTH_CONSTANTS } from '@/app/constants/auth'
import { message } from 'antd'
import { validatePasswordStrength } from '@/app/utils/validation/auth-validation'

export function usePassword() {
  const [passwordInfo, setPasswordInfo] = useState({
    password: '',
    confirmPassword: ''
  })
  
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordInfo(prev => ({ ...prev, [name]: value }))
  }
  
  const validatePassword = () => {
    // 检查密码是否为空
    if (!passwordInfo.password) {
      setPasswordError('请输入密码')
      message.error('请输入密码')
      return false
    }
    
    // 使用增强的密码验证
    const passwordErrors = validatePasswordStrength(passwordInfo.password)
    if (passwordErrors.length > 0) {
      // 设置第一个错误作为状态错误
      setPasswordError(passwordErrors[0])
      
      // 使用普通文本显示所有密码错误
      const errorContent = `密码不符合要求：${passwordErrors.join('；')}`
      message.error({
        content: errorContent,
        duration: 5
      })
      
      return false
    }
    
    // 检查两次密码是否一致
    if (passwordInfo.password !== passwordInfo.confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      message.error('两次输入的密码不一致')
      return false
    }
    
    return true
  }
  
  const updatePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)
    
    if (!validatePassword()) {
      return false
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: passwordInfo.password
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || '密码更新失败'
        setPasswordError(errorMessage)
        message.error(errorMessage)
        setIsLoading(false)
        return false
      }
      
      setPasswordSuccess('密码更新成功')
      message.success('密码更新成功')
      setIsLoading(false)
      return true
    } catch (error) {
      const errorMessage = '发生错误，请稍后重试'
      setPasswordError(errorMessage)
      message.error(errorMessage)
      setIsLoading(false)
      return false
    }
  }
  
  const resetPasswordState = () => {
    setPasswordInfo({
      password: '',
      confirmPassword: ''
    })
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