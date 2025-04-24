# 表单处理最佳实践指南

## 目录

1. [表单处理原则](#表单处理原则)
2. [表单钩子使用指南](#表单钩子使用指南)
3. [用户表单处理 (useUserForm)](#用户表单处理-useuserform)
4. [类型转换最佳实践](#类型转换最佳实践)
5. [表单验证规则](#表单验证规则)
6. [表单组件构建](#表单组件构建)
7. [错误处理](#错误处理)

## 表单处理原则

### 核心原则

1. **关注点分离**：表单状态管理、验证、提交处理应清晰分离
2. **类型安全**：使用TypeScript类型确保表单数据的正确性
3. **重用代码**：使用共享钩子而非重复逻辑
4. **一致的用户体验**：统一的错误提示、加载状态和成功反馈
5. **数据转换分离**：将数据类型转换放在专门的函数中，而非内联

### 代码组织

表单相关代码按以下方式组织：

- **钩子函数**：放在 `app/hooks` 目录下，以 `use` 前缀命名
- **数据转换**：放在 `app/utils` 目录下，按功能领域分类
- **验证规则**：集中在验证相关工具函数中
- **表单组件**：自包含组件，使用钩子处理逻辑

## 表单钩子使用指南

### 基本原则

1. 所有表单钩子应包含：
   - 状态管理
   - 输入处理
   - 验证
   - 提交逻辑
   - 错误处理
   - 重置功能

2. 标准钩子接口应包含：
   - 初始数据
   - 提交回调
   - 可选的完成和取消回调

### 标准命名约定

- `formData`：表单数据对象
- `errors`：表单字段错误对象
- `isSaving`：保存状态标志
- `handleInputChange`：输入变更处理函数
- `saveForm`：表单保存函数
- `resetForm`：表单重置函数
- `updateField`：更新单个字段的函数

## 用户表单处理 (useUserForm)

### 基本用法

```tsx
import { useUserForm } from '@/app/hooks';
import { UserProfile, UserProfileInput } from '@/app/hooks/user/useProfile';

const MyFormComponent = ({ 
  userProfile, 
  onUpdate 
}: {
  userProfile: UserProfile;
  onUpdate: (input: UserProfileInput) => Promise<boolean>;
}) => {
  const {
    formData,
    errors,
    isSaving,
    handleInputChange,
    saveForm,
    resetForm
  } = useUserForm(userProfile, onUpdate);
  
  // 渲染表单...
};
```

### 完整示例

```tsx
import { useUserForm } from '@/app/hooks';

const UserEditForm = ({ userProfile, onUpdate, onComplete }) => {
  const {
    formData,
    errors,
    isSaving,
    handleInputChange,
    saveForm,
    resetForm
  } = useUserForm(userProfile, onUpdate);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await saveForm();
    if (success && onComplete) {
      onComplete();
    }
  };
  
  if (!formData) return <div>加载中...</div>;
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>用户名</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange(e, 'name')}
        />
        {errors.name && <div className="error">{errors.name}</div>}
      </div>
      
      {/* 其他字段... */}
      
      <div>
        <button type="button" onClick={resetForm}>取消</button>
        <button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
};
```

## 类型转换最佳实践

### 使用专用转换函数

对于复杂类型转换，使用 `app/utils/user/profile.ts` 中的工具函数：

```typescript
import { profileToProfileInput, createProfileUpdate } from '@/app/utils/user/profile';

// 转换整个对象
const profileInput = profileToProfileInput(userProfile);

// 只更新部分字段
const partialUpdate = createProfileUpdate(userProfile, { name: 'New Name' });
```

### 避免内联转换

不要在组件中内联转换数据，而应使用工具函数：

```typescript
// ❌ 不推荐
const profileInput = {
  displayName: profile.name || '',
  bio: profile.bio || '',
  // ...其他字段
};

// ✅ 推荐
import { profileToProfileInput } from '@/app/utils/user/profile';
const profileInput = profileToProfileInput(profile);
```

## 表单验证规则

### 验证规则定义

使用集中定义的验证规则：

```typescript
// 在 app/utils/user/profile.ts 中定义
export const profileValidationRules = {
  name: { required: true, maxLength: 50 },
  bio: { required: false, maxLength: 500 },
  location: { required: false, maxLength: 100 },
  website: { required: false, maxLength: 100, isUrl: true },
  company: { required: false, maxLength: 100 }
};
```

### 使用验证钩子

通过 `useValidation` 钩子应用验证规则：

```typescript
const { validateForm, validateField, errors } = useValidation();

// 验证单个字段
validateField('name', value);

// 验证整个表单
if (!validateForm(formData)) {
  return false;
}
```

## 表单组件构建

### 组件分层

1. **表单容器组件**：处理表单状态和提交逻辑
2. **表单展示组件**：纯UI组件，负责渲染表单字段
3. **字段级组件**：可重用的表单字段组件

### 表单组件类型

```typescript
interface FormProps<T, U> {
  initialData: T;
  onSubmit: (data: U) => Promise<boolean>;
  onComplete?: () => void;
  onCancel?: () => void;
}
```

## 错误处理

### 错误类型

1. **字段验证错误**：直接显示在字段下方
2. **表单提交错误**：显示为Toast通知
3. **API错误**：由提交回调处理

### 错误展示位置

- **内联错误**：显示在对应字段下方
- **表单级错误**：显示在表单顶部或底部
- **全局错误**：使用Toast通知 