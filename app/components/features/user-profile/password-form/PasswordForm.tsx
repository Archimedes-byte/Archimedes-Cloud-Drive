import React, { useCallback } from 'react';
import { LockOutlined, KeyOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { FormField } from '@/app/components/common/form';
import { Input, Alert } from '@/app/components/ui/ant';
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

const PasswordForm: React.FC<PasswordFormProps> = ({
  passwordInfo,
  passwordError,
  passwordSuccess,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  handlePasswordChange,
  userEmail
}) => {
  // 处理输入元素获取焦点时自动选中全部文本
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);
  
  // 处理密码输入变化
  const handlePasswordInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handlePasswordChange('password', e.target.value);
  }, [handlePasswordChange]);
  
  // 处理确认密码输入变化
  const handleConfirmPasswordInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handlePasswordChange('confirmPassword', e.target.value);
  }, [handlePasswordChange]);
  
  return (
    <div className={styles.form}>
      {passwordError && (
        <Alert
          message={passwordError}
          type="error"
          showIcon
          className={styles.errorMessage}
        />
      )}
      
      {passwordSuccess && (
        <Alert
          message={passwordSuccess}
          type="success"
          showIcon
          className={styles.successMessage}
        />
      )}
      
      <p className={styles.description}>
        设置密码后，您可以使用邮箱 {userEmail} 和密码登录系统。
      </p>
      
      <FormField label="密码" icon={<LockOutlined />}>
        <Input.Password
          value={passwordInfo.password}
          onChange={handlePasswordInputChange}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="请输入密码（至少8位）"
          iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
        />
      </FormField>
      
      <FormField label="确认密码" icon={<KeyOutlined />}>
        <Input.Password
          value={passwordInfo.confirmPassword}
          onChange={handleConfirmPasswordInputChange}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="请再次输入密码"
          iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
        />
      </FormField>
    </div>
  );
};

export default React.memo(PasswordForm); 