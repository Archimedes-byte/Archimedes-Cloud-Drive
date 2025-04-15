import React from 'react';
import { Lock, Key, EyeOff, Eye } from 'lucide-react';
import FormField from '../FormField';
import styles from './PasswordForm.module.css';

interface PasswordFormProps {
  passwordInfo: {
    password: string;
    confirmPassword: string;
  };
  passwordError: string | null;
  passwordSuccess: string | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
  handlePasswordChange: (field: 'password' | 'confirmPassword', value: string) => void;
  userEmail?: string | null;
}

const PasswordForm = ({
  passwordInfo,
  passwordError,
  passwordSuccess,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  handlePasswordChange,
  userEmail
}: PasswordFormProps) => {
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };
  
  return (
    <div className={styles.form}>
      {passwordError && (
        <div className={styles.errorMessage}>
          {passwordError}
        </div>
      )}
      
      {passwordSuccess && (
        <div className={styles.successMessage}>
          {passwordSuccess}
        </div>
      )}
      
      <p className={styles.description}>
        设置密码后，您可以使用邮箱 {userEmail} 和密码登录系统。
      </p>
      
      <FormField label="密码" icon={<Lock size={16} />}>
        <div className={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            value={passwordInfo.password}
            onChange={(e) => handlePasswordChange('password', e.target.value)}
            onFocus={handleFocus}
            className={styles.input}
            placeholder="请输入密码（至少8位）"
          />
          <button 
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </FormField>
      
      <FormField label="确认密码" icon={<Key size={16} />}>
        <div className={styles.passwordContainer}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={passwordInfo.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            onFocus={handleFocus}
            className={styles.input}
            placeholder="请再次输入密码"
          />
          <button 
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </FormField>
    </div>
  );
};

export default PasswordForm; 