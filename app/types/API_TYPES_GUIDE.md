# API类型定义指南

本指南说明如何在项目中正确定义和使用API类型，以确保类型定义统一、避免重复，并提高代码可维护性。

## 核心原则

1. **类型集中定义**：所有基础API类型都应在 `app/types/shared/api-types.ts` 定义
2. **类型统一导入**：从 `app/types` 导入类型，而不是直接从 `api-types.ts` 导入
3. **类型扩展而非重新定义**：特定领域类型应扩展基础类型，而不是重新定义
4. **避免重复定义**：不要在多个文件中定义相同的类型

## 类型定义结构

```
app/types/
├── index.ts                # 主要导入点
├── shared/
│   └── api-types.ts        # 基础API类型定义
├── core/
│   ├── api.ts              # 核心API类型，从shared导入
│   └── common.ts           # 通用类型
├── api/
│   ├── index.ts            # API类型导出
│   ├── requests.ts         # 请求类型定义
│   └── responses.ts        # 响应类型定义
└── domains/                # 领域特定类型
    ├── fileTypes.ts        # 文件相关类型
    └── ... 
```

## 正确定义类型的方式

### 1. 基础类型定义

所有基础API类型都应在 `app/types/shared/api-types.ts` 中定义：

```typescript
// app/types/shared/api-types.ts
export interface ApiResponse<T = any> extends ResponseStatus {
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```

### 2. 领域特定类型定义

特定领域的类型应扩展基础类型，而不是重新定义：

```typescript
// app/types/api/responses.ts
import { ApiResponse, PaginatedResponse } from '../shared/api-types';

// 正确：扩展基础类型
export interface FileListResponse extends ApiResponse {
  data: FileInfo[];
}

// 正确：使用类型别名
export type FilePaginatedResponse<T> = PaginatedResponse<T>;
```

### 3. 统一导出

通过 `app/types/index.ts` 统一导出所有类型：

```typescript
// app/types/index.ts
export type {
  ApiResponse,
  PaginatedResponse,
  FileOperationResponse
} from './shared/api-types';

export * from './api';
export * from './core/common';
```

## 导入类型的正确方式

### 正确方式

```typescript
// 正确：从统一入口导入
import { ApiResponse, PaginatedResponse } from '@/app/types';
```

### 避免的方式

```typescript
// 错误：直接从shared导入
import { ApiResponse } from '@/app/types/shared/api-types';
```

## 如何修正现有代码

1. 运行 `fix-api-imports.ts` 脚本识别需要修改的导入
2. 将直接导入 `@/app/types/shared/api-types` 的代码修改为从 `@/app/types` 导入
3. 删除或合并重复的类型定义，优先使用共享类型

## 示例

### 前

```typescript
// app/utils/api.ts
import { ApiResponse } from '@/app/types/shared/api-types';

// 重复定义已存在的类型
interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
```

### 后

```typescript
// app/utils/api.ts
import { ApiResponse, PaginatedResponse } from '@/app/types';

// 使用已定义的类型，无需重复定义
```

## 注意事项

- 在修改类型定义前，确保了解现有类型的使用情况
- 进行类型更改时，检查可能的连锁反应和依赖影响
- 在合并相似类型时，确保新类型覆盖所有旧类型的属性和功能 