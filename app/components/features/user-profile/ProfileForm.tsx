import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { UserProfile, UserProfileInput } from '@/app/types';
import { useProfileForm } from '@/app/hooks/user';
import { PersonalInfoForm } from './PersonalInfoForm';
import { ContactInfoForm } from './ContactInfoForm';
import styles from './ProfileForm.module.css';

interface ProfileFormProps {
  /** 用户资料数据 */
  userProfile: UserProfile;
  
  /** 表单模式 */
  mode?: 'simple' | 'complete';
  
  /** 
   * 简单模式下的字段变更处理函数
   * 仅在 mode='simple' 时使用
   */
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
  
  /** 
   * 简单模式下的错误对象
   * 仅在 mode='simple' 时使用，默认使用内部错误状态
   */
  errors?: Record<string, string>;
  
  /** 
   * 完整模式下的更新处理函数
   * 仅在 mode='complete' 时使用
   */
  onUpdate?: (input: UserProfileInput) => Promise<boolean>;
  
  /** 
   * 完整模式下的完成回调
   * 仅在 mode='complete' 时使用
   */
  onComplete?: () => void;
  
  /** 
   * 完整模式下的取消回调
   * 仅在 mode='complete' 时使用
   */
  onCancel?: () => void;
  
  /** 自定义类名 */
  className?: string;
  
  /** 禁用所有字段 */
  disabled?: boolean;
}

export interface ProfileFormRef {
  /** 保存表单 */
  handleSave: () => Promise<boolean>;
  /** 取消编辑 */
  handleCancel: () => void;
  /** 重置表单 */
  resetForm: () => void;
  /** 获取当前表单数据 */
  getFormData: () => UserProfile | null;
}

/**
 * 用户资料表单组件
 * 
 * 整合各子表单组件，管理表单状态和事件处理
 */
const ProfileForm = forwardRef<ProfileFormRef, ProfileFormProps>(({ 
  userProfile,
  mode = 'complete',
  onInputChange,
  errors: externalErrors,
  onUpdate,
  onComplete,
  onCancel,
  className = '',
  disabled = false
}, ref) => {
  // 确定是否为简单模式
  const isSimpleMode = mode === 'simple';
  
  // 完整模式下的表单状态管理
  const {
    formData,
    errors: formErrors,
    handleInputChange: internalHandleChange,
    saveForm,
    resetForm,
    updateField
  } = useProfileForm(
    mode === 'complete' ? userProfile : null, 
    onUpdate || (async () => false)
  );
  
  // 根据模式确定使用的状态和处理函数
  const currentProfile = isSimpleMode ? userProfile : formData;
  const currentErrors = isSimpleMode 
    ? (externalErrors || {}) 
    : formErrors;
  
  // 保存表单并通知完成（完整模式）
  const handleSave = useCallback(async () => {
    if (isSimpleMode) return false;
    
    const success = await saveForm();
    if (success && onComplete) {
      onComplete();
    }
    return success;
  }, [isSimpleMode, saveForm, onComplete]);
  
  // 取消编辑（完整模式）
  const handleCancel = useCallback(() => {
    if (isSimpleMode) return;
    
    resetForm();
    if (onCancel) {
      onCancel();
    }
  }, [isSimpleMode, resetForm, onCancel]);
  
  // 获取当前表单数据
  const getFormData = useCallback(() => {
    return isSimpleMode ? userProfile : formData;
  }, [isSimpleMode, userProfile, formData]);

  // 将方法暴露给父组件
  useImperativeHandle(ref, () => ({
    handleSave,
    handleCancel,
    resetForm,
    getFormData
  }), [handleSave, handleCancel, resetForm, getFormData]);
  
  // 处理简单模式下的输入变更
  const handleSimpleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
    field: string
  ) => {
    if (onInputChange) {
      onInputChange(e, field);
    }
  }, [onInputChange]);
  
  // 根据模式选择适当的输入处理函数
  const currentHandleChange = isSimpleMode ? handleSimpleInputChange : internalHandleChange;
  
  // 处理级联选择器的位置变更
  const handleLocationChange = useCallback((value: any, selectedOptions: any[]) => {
    if (!selectedOptions || selectedOptions.length === 0) return;
    
    // 将选择的省市转换为字符串格式
    const locationText = selectedOptions.map((option: { label: string }) => option.label).join(', ');
    
    if (isSimpleMode) {
      const mockEvent = {
        target: { value: locationText }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onInputChange) {
        onInputChange(mockEvent, 'location');
      }
    } else {
      updateField('location', locationText);
    }
  }, [isSimpleMode, onInputChange, updateField]);
  
  // 如果没有当前资料数据，显示加载状态
  if (!currentProfile) {
    return <div className={styles.loading}>加载中...</div>;
  }
  
  return (
    <div className={`${styles.profileForm} ${className}`}>
      <PersonalInfoForm 
        profile={currentProfile}
        errors={currentErrors}
        onChange={currentHandleChange}
        disabled={disabled}
      />
      
      <ContactInfoForm 
        profile={currentProfile}
        errors={currentErrors}
        onChange={currentHandleChange}
        onLocationChange={handleLocationChange}
        disabled={disabled}
      />
    </div>
  );
});

ProfileForm.displayName = 'ProfileForm';

export default ProfileForm; 