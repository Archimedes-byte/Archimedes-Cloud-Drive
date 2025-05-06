# 类型系统迁移指南

## 概述

为了优化类型系统结构，提高维护性和可读性，我们对类型定义进行了重构。主要工作包括：

1. 将分散在根目录的类型文件迁移到对应的domains目录
2. 保留向后兼容的过渡层，确保现有代码不受影响
3. 统一类型的命名和结构，减少冗余和重复定义
4. **新增：创建共享类型系统，解决类型定义重复问题**

## 迁移路径

| 原始文件 | 新文件 | 状态 |
|---------|-------|------|
| `/app/types/file.ts` | `/app/types/domains/fileTypes.ts` | 已迁移，过渡层已删除 |
| `/app/types/user.ts` | `/app/types/domains/user-profile.ts` | 已迁移，过渡层已删除 |
| `/app/types/auth.ts` | `/app/types/domains/auth.ts` | 已迁移，过渡层已删除 |
| 多处 `ApiResponse` 定义 | `/app/types/shared/api-types.ts` | 已统一到共享类型 |
| 多处 `UserProfile` 定义 | `/app/types/shared/api-types.ts` | 已统一到共享类型 |

## 导入路径建议

请使用以下导入路径替换旧的导入：

```typescript
// ❌ 不推荐 - 已删除
import { FileType } from '@/app/types/file';
import { UserBasic } from '@/app/types/user';
import { LoginCredentials } from '@/app/types/auth';

// ✅ 推荐 - 从主入口导入
import { FileTypeEnum, UserBasic, LoginCredentials } from '@/app/types';

// ✅ 也可以 - 直接从domains导入
import { FileTypeEnum } from '@/app/types/domains/fileTypes';
import { UserBasic } from '@/app/types/domains/user-profile';
import { LoginCredentials } from '@/app/types/domains/auth';

// ✅ 最新推荐 - 使用共享类型（API响应、用户类型等）
import { ApiResponse, UserProfile } from '@/app/types/shared/api-types';
// 或使用命名空间避免命名冲突
import { SharedTypes } from '@/app/types';
const response: SharedTypes.ApiResponse = {...};
```

## 未来计划

1. ~~在确保所有代码都迁移到新的导入路径后，我们将删除根目录的过渡层文件~~ (已完成)
2. 下一步计划改进类型系统：
   - 增强类型安全，使用更多的字面量类型和联合类型
   - 改善文档，增加示例
3. 逐步统一其他重复类型

## 统一类型系统

我们新增了共享类型系统来解决类型定义重复的问题：

- 创建了 `app/types/shared/api-types.ts` 文件，集中定义API响应和用户相关类型
- 使用接口继承实现类型的组合和扩展，确保一致性
- 整合了多处定义的 `ApiResponse`、`UserProfile` 等类型

详细信息请参考：[统一类型系统说明文档](./shared/README.md)

## 废弃计划

以下文件将在未来版本中删除，请确保您的代码不再直接依赖它们：

- `app/types/file.ts` - 计划在v1.1版本后删除
- `app/types/user.ts` - 计划在v1.1版本后删除
- `app/types/auth.ts` - 计划在v1.1版本后删除 