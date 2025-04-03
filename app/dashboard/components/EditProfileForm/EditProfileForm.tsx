import React from 'react';
import { User, MapPin, Building, Globe, Briefcase } from 'lucide-react';
import { UserInfo } from '@/dashboard/hooks/useProfile';
import FormField from '../FormField';
import styles from './EditProfileForm.module.css';

interface EditProfileFormProps {
  userInfo: UserInfo;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => void;
}

const EditProfileForm = ({ userInfo, onInputChange }: EditProfileFormProps) => {
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  };
  
  return (
    <div className={styles.form}>
      <FormField label="用户名" icon={<User size={16} />}>
        <input
          type="text"
          value={userInfo.displayName}
          onChange={(e) => onInputChange(e, 'displayName')}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="请输入用户名"
        />
      </FormField>
      
      <FormField label="个人简介" icon={<Globe size={16} />}>
        <textarea
          value={userInfo.bio}
          onChange={(e) => onInputChange(e, 'bio')}
          onFocus={handleFocus}
          className={`${styles.input} ${styles.textarea}`}
          placeholder="介绍一下你自己..."
          rows={4}
        />
      </FormField>
      
      <FormField label="所在地" icon={<MapPin size={16} />}>
        <input
          type="text"
          value={userInfo.location}
          onChange={(e) => onInputChange(e, 'location')}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="城市，国家"
        />
      </FormField>
      
      <FormField label="个人网站" icon={<Globe size={16} />}>
        <input
          type="url"
          value={userInfo.website}
          onChange={(e) => onInputChange(e, 'website')}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="https://example.com"
        />
      </FormField>
      
      <FormField label="公司/组织" icon={<Briefcase size={16} />}>
        <input
          type="text"
          value={userInfo.company}
          onChange={(e) => onInputChange(e, 'company')}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="请输入公司或组织名称"
        />
      </FormField>
    </div>
  );
};

export default EditProfileForm; 