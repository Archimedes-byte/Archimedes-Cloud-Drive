import { useState } from 'react';
import { UserProfile } from './useProfile';

// 定义错误类型
interface ValidationErrors {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
}

// 验证函数类型
type ValidatorFn = (value: string) => string | undefined;

export const useValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // 基础验证器
  const validators = {
    // 必填字段验证
    required: (fieldName: string): ValidatorFn => (value: string) => {
      return value.trim() === '' ? `${fieldName}不能为空` : undefined;
    },
    
    // 最大长度验证
    maxLength: (fieldName: string, max: number): ValidatorFn => (value: string) => {
      return value.length > max ? `${fieldName}不能超过${max}个字符` : undefined;
    },
    
    // 最小长度验证
    minLength: (fieldName: string, min: number): ValidatorFn => (value: string) => {
      return value.length < min && value.length > 0 ? `${fieldName}不能少于${min}个字符` : undefined;
    },
    
    // URL格式验证
    url: (fieldName: string): ValidatorFn => (value: string) => {
      if (!value) return undefined;
      try {
        // 如果没有提供协议，则默认添加https://
        const urlString = value.match(/^https?:\/\//) ? value : `https://${value}`;
        new URL(urlString);
        return undefined;
      } catch {
        return `${fieldName}格式不正确，请输入有效的URL`;
      }
    },
    
    // 电子邮件格式验证
    email: (fieldName: string): ValidatorFn => (value: string) => {
      if (!value) return undefined;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? `${fieldName}格式不正确` : undefined;
    }
  };

  // 验证整个表单
  const validateForm = (userInfo: Partial<UserProfile>): boolean => {
    const newErrors: ValidationErrors = {};
    
    // 验证用户名
    const nameError = validators.required('用户名')(userInfo.name || '');
    if (nameError) {
      newErrors.name = nameError;
    }
    
    // 验证个人简介
    if (userInfo.bio) {
      const bioLengthError = validators.maxLength('个人简介', 500)(userInfo.bio);
      if (bioLengthError) newErrors.bio = bioLengthError;
    }
    
    // 验证网站URL
    if (userInfo.website) {
      const websiteError = validators.url('个人网站')(userInfo.website);
      if (websiteError) newErrors.website = websiteError;
    }
    
    // 验证地址长度
    if (userInfo.location) {
      const locationError = validators.maxLength('地址', 100)(userInfo.location);
      if (locationError) newErrors.location = locationError;
    }
    
    // 验证公司名称长度
    if (userInfo.company) {
      const companyError = validators.maxLength('公司/组织', 100)(userInfo.company);
      if (companyError) newErrors.company = companyError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 验证单个字段
  const validateField = (field: string, value: string): string | undefined => {
    let error: string | undefined;
    
    switch (field) {
      case 'name':
        error = validators.required('用户名')(value);
        break;
      case 'bio':
        error = validators.maxLength('个人简介', 500)(value);
        break;
      case 'website':
        error = validators.url('个人网站')(value);
        break;
      case 'location':
        error = validators.maxLength('地址', 100)(value);
        break;
      case 'company':
        error = validators.maxLength('公司/组织', 100)(value);
        break;
      default:
        error = undefined;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return error;
  };

  return {
    errors,
    validateForm,
    validateField,
    isValid: Object.keys(errors).length === 0
  };
}; 