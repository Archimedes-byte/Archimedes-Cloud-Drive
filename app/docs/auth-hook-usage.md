# 统一认证Hook使用指南

本文档演示如何使用新的统一认证Hook `useUnifiedAuth`，该Hook整合了之前分散的多个认证相关Hook的功能。

## 基本用法

### 导入Hook

```tsx
import { useUnifiedAuth } from '@/app/hooks/auth';
```

### 在组件中使用

```tsx
'use client';

import React from 'react';
import { useUnifiedAuth } from '@/app/hooks/auth';

const ProfilePage = () => {
  // 获取认证状态和基础操作
  const { 
    user, 
    isAuthenticated, 
    isAuthLoading, 
    logout 
  } = useUnifiedAuth();

  if (isAuthLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>个人资料</h1>
      <p>欢迎, {user?.name || '用户'}!</p>
      <button onClick={() => logout()}>退出登录</button>
    </div>
  );
};

export default ProfilePage;
```

## 登录表单示例

```tsx
'use client';

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/app/hooks/auth';
import { Button, Input } from 'antd';

const LoginPage = () => {
  const { useLoginForm } = useUnifiedAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // 使用登录表单Hook，自动处理表单状态和提交
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    handleGoogleLogin,
    isSubmitting,
    isAuthLoading,
    isError,
    error
  } = useLoginForm({
    callbackUrl: '/dashboard',
    onSuccess: () => console.log('登录成功'),
    onError: (msg) => console.error('登录失败:', msg)
  });

  return (
    <form onSubmit={handleSubmit}>
      {isError && <div className="error">{error}</div>}
      
      <div>
        <label>邮箱</label>
        <Input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.email && errors.email ? 'error' : ''}
        />
        {touched.email && errors.email && <div>{errors.email}</div>}
      </div>
      
      <div>
        <label>密码</label>
        <Input.Password
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.password && errors.password ? 'error' : ''}
          visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
        />
        {touched.password && errors.password && <div>{errors.password}</div>}
      </div>
      
      <Button 
        type="primary" 
        htmlType="submit"
        loading={isSubmitting || isAuthLoading}
      >
        登录
      </Button>
      
      <div>
        <Button onClick={() => {
          // 模拟Google登录响应
          handleGoogleLogin({ credential: 'google-token' });
        }}>
          Google登录
        </Button>
      </div>
    </form>
  );
};

export default LoginPage;
```

## 注册表单示例

```tsx
'use client';

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/app/hooks/auth';
import { Button, Input } from 'antd';

const RegisterPage = () => {
  const { useRegisterForm } = useUnifiedAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // 使用注册表单Hook，自动处理表单状态和提交
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    isAuthLoading,
    isError,
    error
  } = useRegisterForm({
    withName: true, // 包含名称字段
    onSuccess: () => console.log('注册成功'),
    onError: (msg) => console.error('注册失败:', msg)
  });

  return (
    <form onSubmit={handleSubmit}>
      {isError && <div className="error">{error}</div>}
      
      <div>
        <label>姓名</label>
        <Input
          type="text"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.name && errors.name ? 'error' : ''}
        />
        {touched.name && errors.name && <div>{errors.name}</div>}
      </div>
      
      <div>
        <label>邮箱</label>
        <Input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.email && errors.email ? 'error' : ''}
        />
        {touched.email && errors.email && <div>{errors.email}</div>}
      </div>
      
      <div>
        <label>密码</label>
        <Input.Password
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.password && errors.password ? 'error' : ''}
          visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
        />
        {touched.password && errors.password && <div>{errors.password}</div>}
      </div>
      
      <div>
        <label>确认密码</label>
        <Input.Password
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          status={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
          visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
        />
        {touched.confirmPassword && errors.confirmPassword && <div>{errors.confirmPassword}</div>}
      </div>
      
      <Button 
        type="primary" 
        htmlType="submit"
        loading={isSubmitting || isAuthLoading}
      >
        注册
      </Button>
    </form>
  );
};

export default RegisterPage;
```

## API参考

`useUnifiedAuth` Hook提供以下功能：

### 认证状态

- `user`: 当前登录用户信息
- `isAuthenticated`: 是否已认证
- `isAuthLoading`: 认证状态是否正在加载
- `isError`: 是否出现错误
- `error`: 错误信息

### 认证操作

- `login(credentials, options)`: 邮箱密码登录
- `loginWithGoogle(credential, options)`: Google登录
- `register(userData, options)`: 用户注册
- `logout(options)`: 退出登录
- `checkEmailExists(email)`: 检查邮箱是否已注册

### 表单Hooks

- `useLoginForm(options)`: 登录表单Hook
- `useRegisterForm(options)`: 注册表单Hook

## 迁移指南

如果你之前使用的是单独的Hook：

1. 将 `useAuth` 替换为 `useUnifiedAuth`
2. 将 `useLoginForm` 替换为 `const { useLoginForm } = useUnifiedAuth(); const form = useLoginForm();`
3. 将 `useRegisterForm` 替换为 `const { useRegisterForm } = useUnifiedAuth(); const form = useRegisterForm();`

这样可以逐步迁移到新的统一Hook，同时保持向后兼容性。 