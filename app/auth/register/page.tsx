'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError('密码长度至少为6个字符');
      return;
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('注册成功');
        setError('');
        setTimeout(() => {
          router.push('/file_management/main#');
        }, 1500);
      } else {
        setError(data.error || '注册失败');
        setSuccess('');
      }
    } catch (error) {
      setError('注册失败，请重试');
      setSuccess('');
    }
  };

  return (
    <div className="home-page" style={{
      backgroundImage: 'url("/background.jpg")'
    }}>
      <header className="home-header">
        <h1>Archimedes' Cloud Drive</h1>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/register">Register</Link>
        </nav>
      </header>

      <main className="home-content">
        <div className="login-container">
          <h2>注册新账户</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入邮箱"
              />
            </div>

            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="请再次输入密码"
                minLength={6}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit">注册</button>
          </form>

          <div className="login-link">
            <span>已有账户？</span>
            <Link href="/auth/login">登录</Link>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2024 Archimedes' Cloud Drive. All rights reserved.</p>
      </footer>
    </div>
  );
} 