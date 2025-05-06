import { useState, useCallback, useEffect } from 'react';
import { UserProfile, UserProfileInput } from '@/app/types';
import { profileToProfileInput, profileValidationRules, ProfileValidationRule } from '@/app/utils/user/profile';

/**
 * 根据验证规则配置验证字段
 * @param field 字段名
 * @param value 字段值
 * @returns 错误信息，如果没有错误则返回''
 */
function validateField(field: string, value: any): string {
  const rules = profileValidationRules[field as keyof typeof profileValidationRules];
  
  if (!rules) return '';
  
  // 必填验证
  if (rules.required && (!value || value.trim() === '')) {
    return `请输入${field === 'name' ? '显示名称' : field}`;
  }
  
  // 长度验证
  if (rules.maxLength && value && value.length > rules.maxLength) {
    return `${field === 'name' ? '显示名称' : field}最多${rules.maxLength}个字符`;
  }
  
  // URL验证
  if (rules.isUrl && value && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value)) {
    return '请输入有效的网站地址';
  }
  
  return '';
}

/**
 * 表单状态管理Hook
 * 处理用户资料表单的状态、验证和提交
 * 
 * @param initialData 初始表单数据
 * @param onUpdate 更新处理函数
 * @returns 表单状态和操作方法
 */
export function useProfileForm(
  initialData: UserProfile | null,
  onUpdate: (data: UserProfileInput) => Promise<boolean>
) {
  // 表单数据
  const [formData, setFormData] = useState<UserProfile | null>(initialData);
  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 是否已修改
  const [isDirty, setIsDirty] = useState(false);
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 当初始数据变化时更新表单数据
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsDirty(false);
      setErrors({});
    }
  }, [initialData]);
  
  // 处理字段变更
  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const value = e.target.value;
    
    // 验证字段
    const errorMessage = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }));
    
    // 更新表单数据
    setFormData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [field]: value
      };
    });
    
    setIsDirty(true);
  }, []);
  
  // 直接更新字段
  const updateField = useCallback((field: string, value: any) => {
    // 验证字段
    const errorMessage = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }));
    
    // 更新表单数据
    setFormData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [field]: value
      };
    });
    
    setIsDirty(true);
  }, []);
  
  // 验证表单
  const validateForm = useCallback(() => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // 验证所有字段
    const fieldsToValidate = Object.keys(profileValidationRules);
    
    for (const field of fieldsToValidate) {
      const errorMessage = validateField(field, (formData as any)[field]);
      if (errorMessage) {
        newErrors[field] = errorMessage;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [formData]);
  
  // 保存表单
  const saveForm = useCallback(async () => {
    if (!formData || isSubmitting || !isDirty) return false;
    
    // 验证表单
    const isValid = validateForm();
    if (!isValid) return false;
    
    try {
      setIsSubmitting(true);
      
      // 转换为API格式
      const profileInput = profileToProfileInput(formData);
      
      // 提交更新
      const success = await onUpdate(profileInput);
      
      if (success) {
        setIsDirty(false);
      }
      
      return success;
    } catch (error) {
      console.error('保存表单失败:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, isDirty, validateForm, onUpdate]);
  
  // 重置表单
  const resetForm = useCallback(() => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
      setIsDirty(false);
    }
  }, [initialData]);
  
  return {
    formData,
    errors,
    isDirty,
    isSubmitting,
    handleInputChange,
    updateField,
    validateField,
    saveForm,
    resetForm
  };
} 