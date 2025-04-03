'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Login.module.css';
import { AlertCircle } from 'lucide-react';

const ErrorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // 3秒后自动重定向到登录页面
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return '服务器配置错误，请联系管理员。';
      case 'AccessDenied':
        return '访问被拒绝，您可能没有权限访问此资源。';
      case 'Verification':
        return '验证链接无效或已过期，请重新验证。';
      case 'OAuthSignin':
        return '第三方登录过程中发生错误，请稍后重试。';
      case 'SIGNIN_OAUTH_ERROR':
        return '第三方登录连接被重置，可能是网络问题，请重试。';
      case 'OAuthCallback':
        return '第三方授权回调处理失败，可能是网络问题，请重试。';
      case 'OAuthCreateAccount':
        return '无法创建关联账户，请使用其他登录方式。';
      case 'OAuthAccountNotLinked':
        return '此邮箱已使用其他方式登录，请使用原来的登录方式。';
      case 'EmailCreateAccount':
        return '无法创建账户，请联系管理员。';
      case 'Callback':
        return '回调处理失败，请检查网络连接并重试。';
      case 'Signin': 
        return '登录失败，请检查您的凭据。';
      case 'CredentialsSignin':
        return '登录凭据无效，请检查邮箱和密码。';
      case 'ECONNRESET':
        return '网络连接被重置，这可能是暂时性的网络问题，请重试。';
      default:
        return '登录过程中发生错误，请稍后重试。';
    }
  };

  const handleRetry = () => {
    // 清除错误参数，返回登录页
    router.push('/auth/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundEffects}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`}></div>
      </div>

      <main className={styles.content} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.formContainer} style={{ maxWidth: '480px' }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <AlertCircle size={64} className="text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800">认证错误</h2>
            <p className="text-gray-600 mb-4">{getErrorMessage(error)}</p>
            <p className="text-gray-500 text-sm">将在3秒后返回登录页面...</p>
            <div className="flex gap-4">
              <Link 
                href="/auth/login"
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                返回登录页面
              </Link>
              <button
                onClick={handleRetry}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                重试登录
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage; 