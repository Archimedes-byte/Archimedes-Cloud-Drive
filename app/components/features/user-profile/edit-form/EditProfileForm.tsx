import React, { useCallback } from 'react';
import { UserOutlined, EnvironmentOutlined, GlobalOutlined, BankOutlined } from '@ant-design/icons';
import { UserProfile } from '@/app/hooks/user/useProfile';
import { useValidation } from '@/app/hooks';
import { FormField } from '@/app/components/common/form';
import { Input } from '@/app/components/ui/ant';
import styles from './EditProfileForm.module.css';

interface EditProfileFormProps {
  userProfile: UserProfile;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userProfile, onInputChange }) => {
  const { errors, validateField } = useValidation();
  
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  }, []);
  
  // 处理失去焦点时验证字段
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    validateField(field, e.target.value);
  }, [validateField]);
  
  // 创建各字段的处理函数
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e, 'name');
  }, [onInputChange]);
  
  const handleNameBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e, 'name');
  }, [handleBlur]);
  
  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e, 'bio');
  }, [onInputChange]);
  
  const handleBioBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    handleBlur(e, 'bio');
  }, [handleBlur]);
  
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e, 'location');
  }, [onInputChange]);
  
  const handleLocationBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e, 'location');
  }, [handleBlur]);
  
  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e, 'website');
  }, [onInputChange]);
  
  const handleWebsiteBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e, 'website');
  }, [handleBlur]);
  
  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e, 'company');
  }, [onInputChange]);
  
  const handleCompanyBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur(e, 'company');
  }, [handleBlur]);
  
  return (
    <div className={styles.form}>
      <FormField label="用户名" icon={<UserOutlined />}>
        <Input
          value={userProfile.name || ''}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
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
          value={userProfile.bio || ''}
          onChange={handleBioChange}
          onBlur={handleBioBlur}
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
          value={userProfile.location || ''}
          onChange={handleLocationChange}
          onBlur={handleLocationBlur}
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
          value={userProfile.website || ''}
          onChange={handleWebsiteChange}
          onBlur={handleWebsiteBlur}
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
          value={userProfile.company || ''}
          onChange={handleCompanyChange}
          onBlur={handleCompanyBlur}
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
  );
};

export default React.memo(EditProfileForm); 