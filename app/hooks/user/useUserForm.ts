import { useState, useCallback } from 'react';
import { UserProfile, UserProfileInput } from './useProfile';
import { useValidation } from './useValidation';
import { useToast } from '@/app/components/features/dashboard/toaster/Toaster';
import { profileToProfileInput } from '@/app/utils/user/profile';

/**
 * 用户表单处理钩子
 * 提供用于处理用户资料表单的通用功能
 */
export function useUserForm(
  initialProfile: UserProfile | null,
  onUpdateProfile: (input: UserProfileInput) => Promise<boolean>
) {
  // 表单状态
  const [formData, setFormData] = useState<UserProfile | null>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  
  // 工具钩子
  const { validateForm, validateField, errors } = useValidation();
  const toast = useToast();
  
  /**
   * 处理输入变更
   */
  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    field: string
  ) => {
    if (formData) {
      // 更新本地表单数据
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: e.target.value
        };
      });
      
      // 验证字段
      validateField(field, e.target.value);
    }
  }, [formData, validateField]);
  
  /**
   * 保存表单
   */
  const saveForm = useCallback(async (): Promise<boolean> => {
    try {
      if (!formData) {
        toast.error('表单数据无效');
        return false;
      }
      
      // 验证表单
      if (!validateForm(formData)) {
        toast.error('请修正表单中的错误后再提交');
        return false;
      }
      
      // 禁用保存按钮，防止重复提交
      setIsSaving(true);
      
      // 使用工具函数转换UserProfile为UserProfileInput
      const profileInput = profileToProfileInput(formData);
      
      const success = await onUpdateProfile(profileInput);
      
      if (success) {
        toast.success('个人信息已成功保存！');
        return true;
      } else {
        toast.error('保存失败，请稍后重试');
        return false;
      }
    } catch (error) {
      console.error('保存表单时出错:', error);
      toast.error('发生错误，请稍后重试');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, validateForm, onUpdateProfile, toast]);
  
  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setFormData(initialProfile);
  }, [initialProfile]);
  
  /**
   * 更新单个字段
   */
  const updateField = useCallback((field: string, value: any) => {
    if (formData) {
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: value
        };
      });
      
      if (typeof value === 'string') {
        validateField(field, value);
      }
    }
  }, [formData, validateField]);
  
  return {
    formData,
    errors,
    isSaving,
    handleInputChange,
    saveForm,
    resetForm,
    updateField
  };
} 