# 认证相关样式指南

## 样式组织结构

认证系统的样式按照以下结构组织：

### 1. 共享样式模块（`shared.module.css`）
- 包含登录和注册表单共享的样式
- 包括表单字段、按钮、输入框等通用UI元素
- 所有认证组件都应该导入该文件以保持一致性

```tsx
import styles from '@/app/styles/auth/shared.module.css';
```

### 2. 特定页面样式
- 每个特定的认证页面都有自己的样式模块
- 页面样式只包含特定于该页面的布局和UI元素

```
/auth
  /register
    register-page.module.css  // 注册页面特定样式
  /login
    login-page.module.css     // 登录页面特定样式（如果需要）
```

使用示例：
```tsx
import registerStyles from '@/app/styles/auth/register/register-page.module.css';
import styles from '@/app/styles/auth/shared.module.css';
```

## 样式规范

### 命名约定
- 使用kebab-case命名CSS文件：`component-name.module.css`
- 使用camelCase命名CSS类：`.formContainer`

### 按钮样式
- 使用共享样式中的按钮类（不要创建新的按钮样式）：
  - 登录按钮：`styles.loginButton`
  - 注册按钮：`styles.registerButton`
  - 通用按钮容器：`styles.buttonContainer`

### 表单样式
- 使用共享样式中的表单类：
  - 表单容器：`styles.formContainer`
  - 表单元素：`styles.form`
  - 输入组：`styles.inputGroup`
  - 输入框：`styles.input`

## 避免重复
- 不要在全局CSS文件中定义认证相关样式
- 不要为相同功能的组件创建多个样式定义
- 总是检查共享样式中是否已经存在你需要的样式类
- 如果需要特殊样式，考虑使用组合方式而不是创建新样式：
  
  ```tsx
  <div className={`${styles.formContainer} ${styles.specialContainer}`}>
  ```

## 维护注意事项
- 添加新样式前，先检查是否可以使用或扩展现有样式
- 删除不再使用的样式，避免样式文件膨胀
- 如果发现有重复的样式定义，请进行重构和整合 