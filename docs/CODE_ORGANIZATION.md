# 代码组织与最佳实践

本文档旨在明确项目的代码组织结构和最佳实践，帮助开发者理解和遵循项目规范。

## 项目结构

```
app/
├── api/           # API路由和处理程序
├── auth/          # 身份验证相关功能
├── components/    # 组件库
│   ├── common/    # 通用组件
│   ├── features/  # 业务功能组件
│   └── ui/        # UI组件（基于Ant Design）
├── contexts/      # React上下文
├── hooks/         # 自定义钩子
├── lib/           # 第三方库集成
├── services/      # 服务层（API调用、数据处理）
├── store/         # 状态管理
├── styles/        # 全局样式
├── types/         # TypeScript类型定义
└── utils/         # 工具函数
```

## 导入规范

为保持代码一致性和避免重复，必须遵循以下导入规范：

### 1. UI组件导入

**必须使用：**
```typescript
import { Button, Table, Form } from '@/app/components/ui/ant';
```

**严禁使用：**
```typescript
import { Button } from '@/app/components/ui'; // 已废弃
import { Button } from 'antd'; // 未封装组件
```

### 2. 工具函数导入

**必须使用：**
```typescript
// 导入整个命名空间
import { file, format, string } from '@/app/utils';

// 或导入特定函数
import { formatFileSize, getFileNameAndExtension } from '@/app/utils/file';
```

**严禁使用：**
```typescript
// 直接从子模块导入
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { formatFileSize } from '@/app/utils/file/formatter';
```

### 3. 业务组件导入

```typescript
import { UploadModal, FileList, ProfileHeader } from '@/app/components';
```

## 工具函数组织

工具函数按照功能领域组织:

- **api/**: API请求和响应处理
- **date/**: 日期和时间处理 
- **error/**: 错误处理
- **file/**: 文件处理
- **format/**: 格式化工具（类名、文本、数字等）
- **function/**: 函数增强（防抖、节流等）
- **string/**: 字符串处理

## 组件组织

组件按照职责和功能组织:

- **ui/ant/**: Ant Design UI组件（基础组件）
- **common/**: 通用功能组件（与业务无关）
- **features/**: 业务功能组件（特定业务相关）

## 最佳实践

1. **避免代码重复**
   - 不要创建与现有功能重复的函数/组件
   - 使用统一的工具函数库
   
2. **遵循一致的代码风格**
   - 使用项目配置的ESLint和Prettier
   - 保持一致的命名约定

3. **保持模块清晰的职责**
   - lib/ 用于第三方库的集成和封装
   - utils/ 用于通用工具函数
   - services/ 用于业务逻辑和API调用

4. **组件设计规范**
   - 保持组件的单一职责
   - 拆分复杂组件为更小的可管理部分

## 常见问题

### "我在哪里可以找到文件处理相关的工具函数？"

所有文件处理工具函数都应该从 `@/app/utils/file` 导入。该模块集中导出了所有子模块的功能。

### "我应该使用哪个格式化函数？"

- 文本截断: `import { truncateText } from '@/app/utils/format'`
- 首字母大写: `import { capitalizeFirstLetter } from '@/app/utils/format'`
- CSS类合并: `import { cn } from '@/app/utils/format'`

### "如何正确地导入Ant Design组件？"

始终从我们的封装模块导入: `import { Button } from '@/app/components/ui/ant'` 