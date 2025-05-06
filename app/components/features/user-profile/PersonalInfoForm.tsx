import React, { useCallback } from 'react';
import { UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Input } from '@/app/components/ui/ant';
import { FormField } from '@/app/components/common/form';
import { UserProfile } from '@/app/types';
import { handleFocusWithSelect } from '@/app/utils/form/field-handlers';
import styles from './ProfileForm.module.css';

interface PersonalInfoFormProps {
  /** 用户资料数据 */
  profile: UserProfile;
  
  /** 表单错误 */
  errors: Record<string, string>;
  
  /** 字段变更处理函数 */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
  
  /** 禁用表单 */
  disabled?: boolean;
}

/**
 * 用户个人信息表单组件
 * 处理姓名和个人简介等基本字段
 */
export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  profile,
  errors,
  onChange,
  disabled = false
}) => {
  // 创建各个字段的变更处理函数
  const nameChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e, 'name'), 
    [onChange]
  );
  
  const bioChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e, 'bio'), 
    [onChange]
  );
  
  return (
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>个人信息</h3>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <UserOutlined /> 显示名称
        </label>
        <Input
          className={errors.name ? styles.inputError : ''}
          placeholder="设置显示名称"
          value={profile.name || ''}
          onChange={nameChangeHandler}
          onFocus={handleFocusWithSelect}
          maxLength={50}
          disabled={disabled}
          data-testid="profile-name-input"
        />
        {errors.name && <div className={styles.errorText}>{errors.name}</div>}
      </div>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <InfoCircleOutlined /> 个人简介
        </label>
        <Input.TextArea
          className={errors.bio ? styles.inputError : ''}
          placeholder="介绍一下你自己..."
          value={profile.bio || ''}
          onChange={bioChangeHandler}
          maxLength={500}
          showCount
          rows={4}
          disabled={disabled}
          data-testid="profile-bio-input"
        />
        {errors.bio && <div className={styles.errorText}>{errors.bio}</div>}
      </div>
    </div>
  );
}; 