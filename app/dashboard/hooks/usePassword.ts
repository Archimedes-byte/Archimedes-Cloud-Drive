import { useState } from 'react';

interface PasswordInfo {
  password: string;
  confirmPassword: string;
}

export const usePassword = () => {
  const [passwordInfo, setPasswordInfo] = useState<PasswordInfo>({
    password: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (field: keyof PasswordInfo, value: string) => {
    setPasswordInfo(prev => ({...prev, [field]: value}));
    // 重置错误和成功消息
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const updatePassword = async () => {
    // 简单验证
    if (passwordInfo.password.length < 8) {
      setPasswordError('密码长度至少为8位');
      return false;
    }
    
    if (passwordInfo.password !== passwordInfo.confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return false;
    }

    try {
      setIsLoading(true);
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordSuccess('密码设置成功');
      setIsLoading(false);
      return true;
    } catch (err) {
      setPasswordError('密码设置失败，请稍后再试');
      setIsLoading(false);
      return false;
    }
  };

  const resetPasswordState = () => {
    setPasswordInfo({
      password: '',
      confirmPassword: ''
    });
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

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
  };
}; 