import React from 'react';
import { User, MapPin, Globe, Briefcase } from 'lucide-react';
import { UserProfile } from '@/app/hooks/user/useProfile';
import { useValidation } from '@/app/hooks';
import { FormField } from '@/app/components/common/form';
import styles from './EditProfileForm.module.css';

interface EditProfileFormProps {
  userProfile: UserProfile;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
}

const EditProfileForm = ({ userProfile, onInputChange }: EditProfileFormProps) => {
  const { errors, validateField } = useValidation();
  
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  };
  
  // 处理失去焦点时验证字段
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    validateField(field, e.target.value);
  };
  
  return (
    <div className={styles.form}>
      <FormField label="用户名" icon={<User size={16} />}>
        <input
          type="text"
          value={userProfile.name || ''}
          onChange={(e) => onInputChange(e, 'name')}
          onBlur={(e) => handleBlur(e, 'name')}
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
          value={userProfile.bio || ''}
          onChange={(e) => onInputChange(e, 'bio')}
          onBlur={(e) => handleBlur(e, 'bio')}
          onFocus={handleFocus}
          className={`${styles.input} ${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
          placeholder="介绍一下你自己..."
          rows={4}
        />
        <div className={styles.charCount}>
          {(userProfile.bio || '').length}/500
        </div>
        {errors.bio && (
          <div className={styles.errorText}>{errors.bio}</div>
        )}
      </FormField>
      
      <FormField label="所在地" icon={<MapPin size={16} />}>
        <input
          type="text"
          value={userProfile.location || ''}
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
          value={userProfile.website || ''}
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
          value={userProfile.company || ''}
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