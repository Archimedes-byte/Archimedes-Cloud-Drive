'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/file_management/main'
      });

      if (result?.error) {
        setError(result.error);
        setSuccess('');
      }
    } catch (error) {
      setError('登录失败，请重试');
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
          <h2>登录您的账户</h2>
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
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit">登录</button>
          </form>

          <div className="register-link">
            <span>还没有账户？</span>
            <Link href="/auth/register">注册新账户</Link>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2024 Archimedes' Cloud Drive. All rights reserved.</p>
      </footer>
    </div>
  );
} 