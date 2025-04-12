import React from 'react';
import { User, MapPin, Building, Globe, Briefcase } from 'lucide-react';
import { UserInfo } from '@/app/dashboard/page';
import { useValidation } from '../../hooks/useValidation';
import FormField from '../FormField';
import styles from './EditProfileForm.module.css';

interface EditProfileFormProps {
  userInfo: UserInfo;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
}

const EditProfileForm = ({ userInfo, onInputChange }: EditProfileFormProps) => {
  const { errors, validateField } = useValidation();
  
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  };
  
  // 处理失去焦点时验证字段
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof UserInfo) => {
    validateField(field, e.target.value);
  };
  
  return (
    <div className={styles.form}>
      <FormField label="用户名" icon={<User size={16} />}>
        <input
          type="text"
          value={userInfo.displayName}
          onChange={(e) => onInputChange(e, 'displayName')}
          onBlur={(e) => handleBlur(e, 'displayName')}
          onFocus={handleFocus}
          className={`${styles.input} ${errors.displayName ? styles.inputError : ''}`}
          placeholder="请输入用户名"
        />
        {errors.displayName && (
          <div className={styles.errorText}>{errors.displayName}</div>
        )}
      </FormField>
      
      <FormField label="个人简介" icon={<Globe size={16} />}>
        <textarea
          value={userInfo.bio}
          onChange={(e) => onInputChange(e, 'bio')}
          onBlur={(e) => handleBlur(e, 'bio')}
          onFocus={handleFocus}
          className={`${styles.input} ${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
          placeholder="介绍一下你自己..."
          rows={4}
        />
        <div className={styles.charCount}>
          {userInfo.bio.length}/500
        </div>
        {errors.bio && (
          <div className={styles.errorText}>{errors.bio}</div>
        )}
      </FormField>
      
      <FormField label="所在地" icon={<MapPin size={16} />}>
        <input
          type="text"
          value={userInfo.location}
          onChange={(e) => onInputChange(e, 'location')}
          onBlur={(e) => handleBlur(e, 'location')}
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
          value={userInfo.website}
          onChange={(e) => onInputChange(e, 'website')}
          onBlur={(e) => handleBlur(e, 'website')}
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
          value={userInfo.company}
          onChange={(e) => onInputChange(e, 'company')}
          onBlur={(e) => handleBlur(e, 'company')}
          onFocus={handleFocus}
          className={`${styles.input} ${errors.company ? styles.inputError : ''}`}
          placeholder="请输入公司或组织名称"
        />
        {errors.company && (
          <div className={styles.errorText}>{errors.company}</div>
        )}
      </FormField>
    </div>
  );
};

export default EditProfileForm; 