'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  EyeOutlined, EyeInvisibleOutlined, MailOutlined, 
  LockOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import styles from './RegisterForm.module.css';
import { FormField } from '@/app/components/common/form';
import { Button, Input, Space, Alert, Typography } from '@/app/components/ui/ant';

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6个字符');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('注册成功，正在跳转...');
        setError('');
        setTimeout(() => {
          router.push('/file-management/main');
        }, 1000);
      } else {
        setError(data.error || '注册失败');
        setSuccess('');
      }
    } catch (error) {
      setError('注册失败，请重试');
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <Typography.Title level={2}>注册新账户</Typography.Title>
      
      {error && (
        <Alert
          className={styles.message}
          type="error"
          message={error}
          showIcon
        />
      )}

      {success && (
        <Alert
          className={styles.message}
          type="success"
          message={success}
          showIcon
        />
      )}

      <form className={styles.registerForm} onSubmit={handleSubmit}>
        <FormField label="邮箱" icon={<MailOutlined />}>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange(e, 'email')}
            required
            placeholder="请输入邮箱"
            className={styles.input}
          />
        </FormField>

        <FormField label="密码" icon={<LockOutlined />}>
          <Input.Password
            value={formData.password}
            onChange={(e) => handleChange(e, 'password')}
            required
            placeholder="请输入密码（至少6个字符）"
            className={styles.input}
            iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          />
        </FormField>

        <FormField label="确认密码" icon={<CheckCircleOutlined />}>
          <Input.Password
            value={formData.confirmPassword}
            onChange={(e) => handleChange(e, 'confirmPassword')}
            required
            placeholder="请再次输入密码"
            className={styles.input}
            iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          />
        </FormField>

        <Button 
          type="primary"
          htmlType="submit" 
          className={`${styles.button} ${isLoading ? styles.loading : ''}`}
          loading={isLoading}
          block
        >
          {isLoading ? '注册中...' : '注册'}
        </Button>
      </form>

      <div className={styles.link}>
        <Space>
          <span>已有账户？</span>
          <Link href="/auth/login">登录</Link>
        </Space>
      </div>
    </div>
  );
};

export default RegisterForm; 