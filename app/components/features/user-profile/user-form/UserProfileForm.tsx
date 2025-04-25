'use client';

import React, { useCallback } from 'react';
import { UserOutlined, EnvironmentOutlined, GlobalOutlined, BankOutlined } from '@ant-design/icons';
import { UserProfile, UserProfileInput } from '@/app/hooks/user/useProfile';
import { useUserForm } from '@/app/hooks';
import { FormField } from '@/app/components/common/form';
import { Input, Button, Spin } from '@/app/components/ui/ant';
import styles from './UserProfileForm.module.css';

interface UserProfileFormProps {
  userProfile: UserProfile;
  onUpdate: (input: UserProfileInput) => Promise<boolean>;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * 用户资料表单组件
 * 使用useUserForm钩子处理表单状态和验证
 */
const UserProfileForm: React.FC<UserProfileFormProps> = ({ 
  userProfile, 
  onUpdate, 
  onComplete, 
  onCancel 
}) => {
  const {
    formData,
    errors,
    isSaving,
    handleInputChange,
    saveForm,
    resetForm
  } = useUserForm(userProfile, onUpdate);
  
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  }, []);
  
  // 保存表单并通知完成
  const handleSave = useCallback(async () => {
    const success = await saveForm();
    if (success && onComplete) {
      onComplete();
    }
  }, [saveForm, onComplete]);
  
  // 取消编辑
  const handleCancel = useCallback(() => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  }, [resetForm, onCancel]);
  
  // 为各字段创建onChange处理函数
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, 'name');
  }, [handleInputChange]);
  
  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e, 'bio');
  }, [handleInputChange]);
  
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, 'location');
  }, [handleInputChange]);
  
  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, 'website');
  }, [handleInputChange]);
  
  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, 'company');
  }, [handleInputChange]);
  
  // 如果没有表单数据，显示加载中或错误状态
  if (!formData) {
    return (
      <div className={styles.loading}>
        <Spin tip="加载中..." />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <FormField label="用户名" icon={<UserOutlined />}>
          <Input
            value={formData.name || ''}
            onChange={handleNameChange}
            onFocus={handleFocus}
            className={errors.name ? styles.inputError : ''}
            placeholder="请输入用户名"
            status={errors.name ? 'error' : ''}
          />
          {errors.name && (
            <div className={styles.errorText}>{errors.name}</div>
          )}
        </FormField>
        
        <FormField label="个人简介" icon={<GlobalOutlined />}>
          <Input.TextArea
            value={formData.bio || ''}
            onChange={handleBioChange}
            onFocus={handleFocus}
            className={errors.bio ? styles.inputError : ''}
            placeholder="介绍一下你自己..."
            rows={4}
            maxLength={500}
            showCount
            status={errors.bio ? 'error' : ''}
          />
          {errors.bio && (
            <div className={styles.errorText}>{errors.bio}</div>
          )}
        </FormField>
        
        <FormField label="所在地" icon={<EnvironmentOutlined />}>
          <Input
            value={formData.location || ''}
            onChange={handleLocationChange}
            onFocus={handleFocus}
            className={errors.location ? styles.inputError : ''}
            placeholder="城市，国家"
            status={errors.location ? 'error' : ''}
          />
          {errors.location && (
            <div className={styles.errorText}>{errors.location}</div>
          )}
        </FormField>
        
        <FormField label="个人网站" icon={<GlobalOutlined />}>
          <Input
            type="url"
            value={formData.website || ''}
            onChange={handleWebsiteChange}
            onFocus={handleFocus}
            className={errors.website ? styles.inputError : ''}
            placeholder="https://example.com"
            status={errors.website ? 'error' : ''}
          />
          {errors.website && (
            <div className={styles.errorText}>{errors.website}</div>
          )}
        </FormField>
        
        <FormField label="公司/组织" icon={<BankOutlined />}>
          <Input
            value={formData.company || ''}
            onChange={handleCompanyChange}
            onFocus={handleFocus}
            className={errors.company ? styles.inputError : ''}
            placeholder="请输入公司或组织名称"
            status={errors.company ? 'error' : ''}
          />
          {errors.company && (
            <div className={styles.errorText}>{errors.company}</div>
          )}
        </FormField>
      </div>
      
      <div className={styles.actions}>
        <Button
          onClick={handleCancel}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          取消
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          className={styles.saveButton}
          disabled={isSaving}
          loading={isSaving}
        >
          {isSaving ? '保存中...' : '保存更改'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(UserProfileForm); 