'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, CheckCircle } from 'lucide-react';
import styles from './RegisterForm.module.css';
import { FormField } from '@/app/components/common/form';

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
      <h2>注册新账户</h2>
      
      {error && (
        <div className={`${styles.message} ${styles.error}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`${styles.message} ${styles.success}`}>
          {success}
        </div>
      )}

      <form className={styles.registerForm} onSubmit={handleSubmit}>
        <FormField label="邮箱" icon={<Mail size={16} />}>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange(e, 'email')}
            required
            placeholder="请输入邮箱"
            className={styles.input}
          />
        </FormField>

        <FormField label="密码" icon={<Lock size={16} />}>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleChange(e, 'password')}
              required
              placeholder="请输入密码（至少6个字符）"
              className={styles.input}
            />
            <button 
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FormField>

        <FormField label="确认密码" icon={<CheckCircle size={16} />}>
          <div className={styles.passwordContainer}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleChange(e, 'confirmPassword')}
              required
              placeholder="请再次输入密码"
              className={styles.input}
            />
            <button 
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FormField>

        <button 
          type="submit" 
          className={`${styles.button} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading}
        >
          <span>{isLoading ? '注册中...' : '注册'}</span>
        </button>
      </form>

      <div className={styles.link}>
        <span>已有账户？</span>
        <Link href="/auth/login">登录</Link>
      </div>
    </div>
  );
};

export default RegisterForm; 