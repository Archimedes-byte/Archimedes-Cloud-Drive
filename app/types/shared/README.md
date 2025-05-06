# 统一类型系统说明文档

## 概述

为了解决类型定义重复和不一致的问题，我们对项目的类型系统进行了重构，创建了一个集中的类型定义机制。本文档提供关于这个新系统的说明和使用指南。

## 核心变更

1. 创建了共享类型目录 (`app/types/shared/`)，集中定义常用类型
2. 整合了多处定义的 `ApiResponse`、`UserProfile` 等类型
3. 采用接口继承模式实现类型的组合和扩展
4. 更新了导入路径，统一从主入口导入

## 类型架构

新的类型系统采用层次化设计：

```
app/types/
├── shared/               # 共享类型定义
│   ├── api-types.ts      # API相关类型
│   └── index.ts          # 导出所有共享类型
├── domains/              # 领域特定类型
├── core/                 # 核心/基础类型
└── index.ts              # 主入口，整合所有类型导出
```

## 如何使用

### 导入通用API类型

```typescript
// 推荐方式：从主入口导入
import { UserProfile, UserProfileInput, LoginCredentials } from '@/app/types';

// 或者从共享类型导入（处理命名冲突时使用）
import { ApiResponse, UserProfile } from '@/app/types/shared/api-types';

// 也可以导入整个命名空间（避免命名冲突）
import { SharedTypes } from '@/app/types';
const response: SharedTypes.ApiResponse<any> = {...};
```

### API响应类型

所有API响应都应该使用统一的 `ApiResponse<T>` 类型：

```typescript
// 定义API响应处理函数
function handleResponse<T>(response: ApiResponse<T>): T | null {
  if (!response.success || !response.data) {
    console.error(response.error || '请求失败');
    return null;
  }
  return response.data;
}
```

### 用户相关类型

用户相关类型已经统一，不再有多处定义：

```typescript
// 使用UserProfile类型
function renderUserInfo(user: UserProfile) {
  return <div>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
    {user.bio && <p>{user.bio}</p>}
  </div>;
}
```

## 迁移指南

1. 更新现有代码的导入路径：
   - 将 `from '@/app/types/domains/auth'` 替换为 `from '@/app/types'`
   - 将 `from '@/app/types/core/api'` 替换为 `from '@/app/types'`

2. 处理命名冲突：
   - 如果出现命名冲突错误，使用 `SharedTypes` 命名空间访问类型
   - 或者使用 `import type { X } from '@/app/types/shared/api-types'` 精确导入

3. API响应处理：
   - 通过 `response.data` 访问响应数据，不再使用直接属性访问

## 注意事项

1. 为保持向后兼容，旧文件中的类型定义暂时保留，但使用别名方式避免冲突
2. 新代码应该使用共享类型定义，不要创建重复的类型
3. 如果需要扩展现有类型，请使用接口继承而非重新定义

## 后续计划

1. 逐步移除旧的类型定义文件
2. 进一步整合其他重复类型
3. 添加更详细的类型文档和注释 