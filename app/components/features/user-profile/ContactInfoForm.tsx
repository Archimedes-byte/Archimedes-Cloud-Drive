import React, { useCallback } from 'react';
import { EnvironmentOutlined, GlobalOutlined, BankOutlined } from '@ant-design/icons';
import { Input, Cascader } from '@/app/components/ui/ant';
import { UserProfile } from '@/app/types';
import { handleFocusWithSelect } from '@/app/utils/form/field-handlers';
import { chinaProvinces } from '@/app/constants/china-regions';
import styles from './ProfileForm.module.css';

interface ContactInfoFormProps {
  /** 用户资料数据 */
  profile: UserProfile;
  
  /** 表单错误 */
  errors: Record<string, string>;
  
  /** 字段变更处理函数 */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
  
  /** 区域选择变更处理函数 */
  onLocationChange?: (value: any, selectedOptions: any[]) => void;
  
  /** 禁用表单 */
  disabled?: boolean;
}

/**
 * 用户联系信息表单组件
 * 处理位置、网站和公司等联系方式相关字段
 */
export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({
  profile,
  errors,
  onChange,
  onLocationChange,
  disabled = false
}) => {
  // 创建各个字段的变更处理函数
  const websiteChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e, 'website'), 
    [onChange]
  );
  
  const companyChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e, 'company'), 
    [onChange]
  );
  
  // 处理级联选择器的位置变更
  const handleLocationChange = useCallback((value: any, selectedOptions: any[]) => {
    if (!selectedOptions || selectedOptions.length === 0 || !onLocationChange) return;
    onLocationChange(value, selectedOptions);
  }, [onLocationChange]);
  
  // 当没有提供位置级联选择器回调时使用输入框
  const locationChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      onChange(e, 'location'), 
    [onChange]
  );
  
  return (
    <div className={styles.formGroup}>
      <h3 className={styles.sectionTitle}>联系信息</h3>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <EnvironmentOutlined /> 位置
        </label>
        {onLocationChange ? (
          <Cascader
            className={`${styles.cascaderWrapper} ${errors.location ? styles.inputError : ''}`}
            options={chinaProvinces}
            placeholder="选择您的位置"
            onChange={handleLocationChange}
            disabled={disabled}
            data-testid="profile-location-cascader"
            popupClassName={styles.cascaderDropdown}
          />
        ) : (
          <Input
            className={errors.location ? styles.inputError : ''}
            placeholder="您所在的城市"
            value={profile.location || ''}
            onChange={locationChangeHandler}
            onFocus={handleFocusWithSelect}
            maxLength={100}
            disabled={disabled}
            data-testid="profile-location-input"
          />
        )}
        {errors.location && <div className={styles.errorText}>{errors.location}</div>}
      </div>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <GlobalOutlined /> 网站
        </label>
        <Input
          className={errors.website ? styles.inputError : ''}
          placeholder="您的个人网站或博客"
          value={profile.website || ''}
          onChange={websiteChangeHandler}
          onFocus={handleFocusWithSelect}
          maxLength={100}
          disabled={disabled}
          data-testid="profile-website-input"
        />
        {errors.website && <div className={styles.errorText}>{errors.website}</div>}
      </div>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          <BankOutlined /> 公司
        </label>
        <Input
          className={errors.company ? styles.inputError : ''}
          placeholder="您的公司或组织"
          value={profile.company || ''}
          onChange={companyChangeHandler}
          onFocus={handleFocusWithSelect}
          maxLength={100}
          disabled={disabled}
          data-testid="profile-company-input"
        />
        {errors.company && <div className={styles.errorText}>{errors.company}</div>}
      </div>
    </div>
  );
}; 