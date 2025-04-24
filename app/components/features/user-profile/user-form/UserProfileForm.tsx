'use client';

import React from 'react';
import { User, MapPin, Globe, Briefcase } from 'lucide-react';
import { UserProfile, UserProfileInput } from '@/app/hooks/user/useProfile';
import { useUserForm } from '@/app/hooks';
import { FormField } from '@/app/components/common/form';
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
const UserProfileForm = ({ 
  userProfile, 
  onUpdate, 
  onComplete, 
  onCancel 
}: UserProfileFormProps) => {
  const {
    formData,
    errors,
    isSaving,
    handleInputChange,
    saveForm,
    resetForm
  } = useUserForm(userProfile, onUpdate);
  
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  };
  
  // 保存表单并通知完成
  const handleSave = async () => {
    const success = await saveForm();
    if (success && onComplete) {
      onComplete();
    }
  };
  
  // 取消编辑
  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };
  
  // 如果没有表单数据，显示加载中或错误状态
  if (!formData) {
    return (
      <div className={styles.loading}>
        加载中...
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <FormField label="用户名" icon={<User size={16} />}>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange(e, 'name')}
            onFocus={handleFocus}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="请输入用户名"
          />
          {errors.name && (
            <div className={styles.errorText}>{errors.name}</div>
          )}
        </FormField>
        
        <FormField label="个人简介" icon={<Globe size={16} />}>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleInputChange(e, 'bio')}
            onFocus={handleFocus}
            className={`${styles.input} ${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
            placeholder="介绍一下你自己..."
            rows={4}
          />
          <div className={styles.charCount}>
            {(formData.bio || '').length}/500
          </div>
          {errors.bio && (
            <div className={styles.errorText}>{errors.bio}</div>
          )}
        </FormField>
        
        <FormField label="所在地" icon={<MapPin size={16} />}>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange(e, 'location')}
            onFocus={handleFocus}
            className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
            placeholder="城市，国家"
          />
          {errors.location && (
            <div className={styles.errorText}>{errors.location}</div>
          )}
        </FormField>
        
        <FormField label="个人网站" icon={<Globe size={16} />}>
          <input
            type="url"
            value={formData.website || ''}
            onChange={(e) => handleInputChange(e, 'website')}
            onFocus={handleFocus}
            className={`${styles.input} ${errors.website ? styles.inputError : ''}`}
            placeholder="https://example.com"
          />
          {errors.website && (
            <div className={styles.errorText}>{errors.website}</div>
          )}
        </FormField>
        
        <FormField label="公司/组织" icon={<Briefcase size={16} />}>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => handleInputChange(e, 'company')}
            onFocus={handleFocus}
            className={`${styles.input} ${errors.company ? styles.inputError : ''}`}
            placeholder="请输入公司或组织名称"
          />
          {errors.company && (
            <div className={styles.errorText}>{errors.company}</div>
          )}
        </FormField>
      </div>
      
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存更改'}
        </button>
      </div>
    </div>
  );
};

export default UserProfileForm; 