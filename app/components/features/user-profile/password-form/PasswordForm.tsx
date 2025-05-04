import React, { useCallback } from 'react';
import { LockOutlined, KeyOutlined, InfoCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { FormField, PasswordInput } from '@/app/components/common/form';
import { Alert, Tooltip, Form, Input, Button, Progress } from '@/app/components/ui/ant';
import { AUTH_CONSTANTS } from '@/app/constants/auth';
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
  
  // 生成密码要求提示内容
  const getPasswordRequirements = () => {
    const requirements = [
      `至少 ${AUTH_CONSTANTS.PASSWORD.MIN_LENGTH} 个字符`,
    ];
    
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_NUMBERS) {
      requirements.push('至少包含 1 个数字');
    }
    
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_UPPERCASE) {
      requirements.push('至少包含 1 个大写字母');
    }
    
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_LOWERCASE) {
      requirements.push('至少包含 1 个小写字母');
    }
    
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_SPECIAL) {
      requirements.push('至少包含 1 个特殊字符');
    }
    
    return (
      <ul className={styles.requirementsList}>
        {requirements.map((req, index) => (
          <li key={index}>{req}</li>
        ))}
      </ul>
    );
  };
  
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
      
      <div className={styles.passwordRequirements}>
        <Alert
          message="密码要求"
          description={getPasswordRequirements()}
          type="info"
          showIcon
          className={styles.requirementsAlert}
        />
      </div>
      
      <FormField 
        label="密码" 
        icon={<LockOutlined />}
        suffix={
          <Tooltip title="请设置符合要求的强密码">
            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
          </Tooltip>
        }
      >
        <PasswordInput
          value={passwordInfo.password}
          onChange={handlePasswordInputChange}
          onFocus={handleFocus}
          className={styles.input}
          placeholder={`请输入密码（至少${AUTH_CONSTANTS.PASSWORD.MIN_LENGTH}位）`}
        />
      </FormField>
      
      <FormField label="确认密码" icon={<KeyOutlined />}>
        <PasswordInput
          value={passwordInfo.confirmPassword}
          onChange={handleConfirmPasswordInputChange}
          onFocus={handleFocus}
          className={styles.input}
          placeholder="请再次输入密码"
        />
      </FormField>
    </div>
  );
};

export default React.memo(PasswordForm); 